const ejs = require('ejs');
const _ = require('lodash');

/**
 * @extends Error
 * @param {Number} code Unique numeric identifier for this error type.
 * @param {String} tag Unique string identifier for this error type. Must be capitalized snake case (/^[A-Z_]*$/).
 * @param {String} template EJS template to build error message.
 * @param {Object} parameters EJS parameters for template rendering.
 * @param {Errors|Error|*} cause Previous Error generating this one.
 */
class Errors extends Error {
	constructor(message, code, tag, { cause = null, origin = null, ...parameters }) {
		super(message);

		this.code = code;
		this.tag = tag;
		this.cause = cause;
		this.origin = origin;
		this.parameters = parameters;
	}

	/**
	 * Build an simplified object with code, tag, message, cause(if exists) and stack trace(if enable)
	 *
	 * @return {Object} Raw object
	 */
	get() {
		return {
			code: this.code,
			tag: this.tag,
			message: this.message,
			...this.cause && { cause: Errors.get(this.cause) },
			...(Errors.origin || this.origin) && { origin: [ ...(Errors.origin && [ Errors.origin ]) || [], ...(this.origin && [ this.origin ]) || [] ].join('_') },
			...Errors.isStackEnabled && { stack: this.stack },
		};
	}

	/**
	 * Build a simplified object as instance.get(), handle native Error, return parameter if not an Error.
	 *
	 *  @function Errors.get
	 * @memberof Errors
	 * @static
	 * @param  {Errors|Error|*} error Native Error, Enhanced Error, or any.
	 * @return {Object} Simplified object
	 */
	static get(error) {
		if (error instanceof Errors) {
			return error.get();
		}
		if (error instanceof Error) {
			return _.pick(error, [ 'message', ...((Errors.isStackEnabled && [ 'stack' ]) || []) ]);
		}

		return error;
	}

	/**
	 * Build Errors or Error from plain object returned by get.<br/>
	 * Use for serialize / unserialize.<br/>
	 * Return parameter if parse fail.<br/>
	 *
	 * @function Errors.parse
	 * @memberof Errors
	 * @static
	 * @param  {Object} object Object to parse.
	 * @return {Errors|Error|*} Rebuilt error
	 */
	static parse(object) {
		let error = object;
		if (error && typeof error === 'object') {
			const { message, code, tag, cause, stack, ...parameters } = error;
			if (message && code && tag) {
				error = new Errors(message, code, tag, { cause: Errors.parse(cause), ...parameters });
			} else if (message && !code && !tag && !cause && !Object.keys(parameters).length) {
				error = new Error(message);
			}
			if (stack) {
				error.stack = stack;
			}
		}

		return error;
	}

	/**
	 * Register tag as key in Factory, with code as value.<br/>
	 * Register code as key in Factory.tags, with tag as value.<br/>
	 * Register function tag in camel case in this for error generation.<br/>
	 * @function Errors.register
	 * @memberof Errors
	 * @static
	 * @param {String} tag Unique string identifier for this error type. Must be snake case (/^[A-Z_]*$/).
	 * @param {Number} code Unique numeric identifier for this error type.
	 * @param {String} [template=''] EJS template to build error message.
	 * @param {Array<String>}  [requiredAttrs=[]] Required attributes for previous EJS template. Rendering fail if those attributes are undefined.
	 * @return {undefined}
	 */
	static register(tag, code, template = '', requiredAttrs = []) {
		const Validator = require('validator-chain'); // Require at runtime because Validator is cycle dependent
		Validator(tag, 'tag').exist().instance('String').match(/^[A-Z_]*$/).try();
		Validator(code, 'code').exist().instance('Number', 'String').try();
		Validator(template, 'template').exist().instance('String').try();
		Validator(requiredAttrs, 'requiredAttrs').exist().array().each(child => child.instance('String')).try();
		Validator(Errors[tag], `Errors.${tag}`).not.exist().try();
		Validator(Errors.tags[code], `Errors.tags[${code}]`).not.exist().try();

		Errors[tag] = code;
		Errors.tags[code] = tag;
		// eslint-disable-next-line func-names
		Errors[_.camelCase(tag)] = function (parameters = {}) { // Not use arrow syntax to avoird this capture
			Validator(parameters, 'parameters').instance('Object').keys(requiredAttrs).try();

			const error = new Errors(`${tag}(${code})${template && ` - ${ejs.render(template, parameters)}`}`, code, tag, parameters);
			Error.captureStackTrace(error, this);

			return error;
		};
	}

	static registerError(...args) {
		console.log('Warning: registerError is depreciated use register instead');

		return Errors.register(...args);
	}

	/**
	 * Built an error by Tag or code
	 * @function Errors.build
	 * @memberof Errors
	 * @static
	 * @param  {String|Number} identifier [description]
	 * @param  {Object} parameters [description]
	 * @return {Errors}            [description]
	 */
	static build(identifier, parameters) {
		// eslint-disable-next-line no-nested-ternary
		const functionName = _.camelCase((typeof identifier === 'number' && this.tags[identifier]) || (typeof identifier === 'string' && identifier) || '');
		if (typeof Errors[functionName] !== 'function') {
			throw Errors.doesntExist({ name: `Errors.${functionName}`, origin: 'Errors' });
		}

		return Errors[functionName](parameters);
	}

	static buildError(...args) {
		console.log('Warning: buildError is depreciated use build instead');

		return Errors.build(...args);
	}
}

/**
 * Define if stack trace is included in get.</br>
 * Default value is true if NODE_ENV is development, false otherwise.</br>
 * Could be change at any time durring runtime.
 *
 * @memberof Errors
 * @type {Boolean}
 */
Errors.isStackEnabled = (process.env.NODE_ENV === 'development');
Errors.origin = '';
Errors.tags = {};
Errors.class = Errors;


function _registerError(tag, code, template = '', requiredAttrs = []) {
	Errors[tag] = code;
	Errors.tags[code] = tag;
	// eslint-disable-next-line func-names
	Errors[_.camelCase(tag)] = function (parameters = {}) { // Not use arrow syntax to avoird this capture
		const Validator = require('validator-chain'); // Require at runtime because Validator is cycle dependent
		Validator(parameters, 'parameters').instance('Object').keys(requiredAttrs).try();

		const error = new Errors(`${tag}(${code})${template && ` - ${ejs.render(template, parameters)}`}`, code, tag, parameters);
		Error.captureStackTrace(error, this);

		return error;
	};
}


/**
 * @memberof Errors
 * @function internalError
 * @property {Number} CODE 1
 * @property {String} TAG INTERNAL_ERROR
 */
_registerError('INTERNAL_ERROR', 1, '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function unexpectedError
 * @property {Number} CODE 2
 * @property {String} TAG UNEXPECTED_ERROR
 */
_registerError('UNEXPECTED_ERROR', 2, '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function programingFault
 * @property {Number} CODE 3
 * @property {String} TAG PROGRAMING_FAULT
 */
_registerError('PROGRAMING_FAULT', 3, '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function notYetImplemented
 * @property {Number} CODE 4
 * @property {String} TAG NOT_YET_IMPLEMENTED
 */
_registerError('NOT_YET_IMPLEMENTED', 4, 'Feature(<%- name %>) is not yet implemented.<% if (locals.reason) { %><%- reason %><% } %>', [ 'name' ]);


/**
 * @memberof Errors
 * @function initialized
 * @property {Number} CODE 100
 * @property {String} TAG INITIALIZED
 */
_registerError('INITIALIZED', 100, 'Resource(<%- name %>) is already initialized.', [ 'name' ]);
/**
 * @memberof Errors
 * @function notInitialized
 * @property {Number} CODE 101
 * @property {String} TAG NOT_INITIALIZED
 */
_registerError('NOT_INITIALIZED', 101, 'Resource(<%- name %>) is not initialized.', [ 'name' ]);

/**
 * @memberof Errors
 * @function invalid
 * @property {Number} CODE 110
 * @property {String} TAG INVALID
 */
_registerError('INVALID', 110, '<%- name %> is invalid.<% if (locals.reason) { %><%- reason %><% } %>', [ 'name' ]);
/**
 * @memberof Errors
 * @function invalidType
 * @property {Number} CODE 111
 * @property {String} TAG INVALID_TYPE
 */
_registerError('INVALID_TYPE', 111, '<%- name %> as invalid type(<%- actualType %>) instead of (<%- expectedType %>).', [ 'name', 'actualType', 'expectedType' ]);

/**
 * @memberof Errors
 * @function exist
 * @property {Number} CODE 112
 * @property {String} TAG EXIST
 */
_registerError('EXIST', 112, 'Resource(<%- name %>) exist.', [ 'name' ]);
/**
 * @memberof Errors
 * @function doesntExist
 * @property {Number} CODE 113
 * @property {String} TAG DOESNT_EXIST
 */
_registerError('DOESNT_EXIST', 113, 'Resource(<%- name %>) doesn\'t exist.', [ 'name' ]);

/**
 * @memberof Errors
 * @function equal
 * @property {Number} CODE 114
 * @property {String} TAG EQUAL
 */
_registerError('EQUAL', 114, '<%- name %>(<%- value %>) is forbidden', [ 'name', 'value' ]);
/**
 * @memberof Errors
 * @function notEqual
 * @property {Number} CODE 115
 * @property {String} TAG NOT_EQUAL
 */
_registerError('NOT_EQUAL', 115, '<%- name %>(<%- actualValue %>) is not equal to <%- expectedValue %>', [ 'name', 'actualValue', 'expectedValue' ]);

/**
 * @memberof Errors
 * @function greaterThan
 * @property {Number} CODE 116
 * @property {String} TAG GREATER_THAN
 */
_registerError('GREATER_THAN', 116, '<%- name %>(<%- value %>) is greater than <%- limit %>', [ 'name', 'value', 'limit' ]);
/**
 * @memberof Errors
 * @function notGreaterThan
 * @property {Number} CODE 117
 * @property {String} TAG NOT_GREATER_THAN
 */
_registerError('NOT_GREATER_THAN', 117, '<%- name %>(<%- value %>) is not greater than <%- limit %>', [ 'name', 'value', 'limit' ]);
/**
 * @memberof Errors
 * @function lowerThan
 * @property {Number} CODE 118
 * @property {String} TAG LOWER_THAN
 */
_registerError('LOWER_THAN', 118, '<%- name %>(<%- value %>) is lower than <%- limit %>', [ 'name', 'value', 'limit' ]);
/**
 * @memberof Errors
 * @function notLowerThan
 * @property {Number} CODE 119
 * @property {String} TAG NOT_LOWER_THAN
 */
_registerError('NOT_LOWER_THAN', 119, '<%- name %>(<%- value %>) is not lower than <%- limit %>', [ 'name', 'value', 'limit' ]);

/**
 * @memberof Errors
 * @function included
 * @property {Number} CODE 120
 * @property {String} TAG INCLUDED
 */
_registerError('INCLUDED', 120, '<%- name %>(<%- value %>) is included in <%- forbiddenValues %>', [ 'name', 'value', 'forbiddenValues' ]);
/**
 * @memberof Errors
 * @function notIncluded
 * @property {Number} CODE 121
 * @property {String} TAG NOT_INCLUDED
 */
_registerError('NOT_INCLUDED', 121, '<%- name %>(<%- value %>) is not included in <%- possibleValues %>', [ 'name', 'value', 'possibleValues' ]);
/**
 * @memberof Errors
 * @function invalidFormat
 * @property {Number} CODE 122
 * @property {String} TAG INVALID_FORMAT
 */
_registerError('INVALID_FORMAT', 122, '<%- name %>(<%- value %>) format is not valid(<%- format %>)', [ 'name', 'value', 'format' ]);


module.exports = Errors;
