const ejs = require('ejs');
const _ = require('lodash');


function stringify(...args) {
	return args.map(item => require('util').inspect(item, { showHidden: false, depth: null })).join(', ');
}

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


function instanceOf(data) {
	return (data !== undefined && data !== null) ? data.constructor.name : 'undefined';
}

function isInstance(item, expectedInstance) {
	if (item === undefined || item === null) {
		return expectedInstance === 'undefined';
	}

	const isFinalInstance = [ 'Boolean', 'Number', 'String', 'Array', 'Object', 'Function' ];
	const proto = Object.getPrototypeOf(item);
	const type = instanceOf(proto);

	return (type === expectedInstance) || (!isFinalInstance.includes(type) && isInstance(proto, expectedInstance));
}

class ValidatorChain {
	constructor(value, name = '') {
		this.value = value;
		this.name = name;
		this.modifier = true;
		this.children = [ ];
		this._isValid = true;
		this.error = null;

		/* key words */
		this.must = this;
		this.have = this;
		this.has = this;
		this.been = this;
		this.be = this;
		this.is = this;
		this.are = this;
		this.a = this;
		this.an = this;
		this.and = this;
		this.of = this;
	}

	invalidate(error) {
		this._isValid = false;
		this.error = error;

		return this;
	}

	resetModifier() {
		this.modifier = true;

		return this;
	}

	get isValid() {
		return this._isValid && this.children.map(child => child.isValid).reduce((a, b) => a && b, true);
	}

	get not() {
		this.modifier = !this.modifier;

		return this;
	}

	invalidateOn(test, buildError, buildRevError) {
		if (this.isValid === true) {
			try {
				if (test() === this.modifier) {
					this.invalidate(this.modifier ? buildError() : buildRevError());
				}
			} catch (cause) {
				throw Errors.programingFault({ reason: 'Validation was interupted by unhandeled throws error', cause });
			}
		}

		return this.resetModifier();
	}

	exist() {
		return this.invalidateOn(() => instanceOf(this.value) === 'undefined',
			() => Errors.doesntExist({ name: this.name }),
			() => Errors.exist({ name: this.name }));
	}

	type(expectedType) {
		const actualType = typeof this.value;

		return this.invalidateOn(() => actualType !== expectedType,
			() => Errors.invalidType({ name: this.name, actualType, expectedType: `${expectedType}` }),
			() => Errors.invalidType({ name: this.name, actualType, expectedType: `!${expectedType}` }));
	}

	instance(...args) {
		const expectedTypes = _.flattenDeep(args);

		return this.invalidateOn(() => expectedTypes.map(expectedType => !isInstance(this.value, expectedType)).reduce((a, b) => a && b),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: `${expectedTypes.join(', ')}` }),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: `!${expectedTypes.join(', ')}` }));
	}

	match(regex) {
		return this.invalidateOn(() => !regex.test(this.value),
			() => Errors.invalidFormat({ name: this.name, value: stringify(this.value), format: `regex(${stringify(regex)})` }),
			() => Errors.invalidFormat({ name: this.name, value: stringify(this.value), format: `!regex(${stringify(regex)})` }));
	}

	boolean() {
		return this.instance('Boolean');
	}

	number() {
		return this.instance('Number');
	}

	string() {
		return this.instance('String');
	}

	object() {
		return this.instance('Object');
	}

	array() {
		return this.invalidateOn(() => !Array.isArray(this.value),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: 'Array' }),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: '!Array' }));
	}

	each(apply) {
		try {
			if (this.isValid === true) {
				const children = this.value.map((child, idx) => new ValidatorChain(child, `${this.name}[${idx}]`));
				this.children.push(...children);
				children.forEach(apply);
			}
		} catch (cause) {
			this.invalidate(Errors.programingFault({ reason: 'Children validation interupted by unhandeled throws error', cause }));
		}

		return this;
	}

	keys(...args) {
		const parameterToValidator = (parameter, index) => {
			const parameterName = `parameter${index || ''}`;
			try {
				const parameterValidator = new ValidatorChain(parameter, parameterName);
				const actualType = instanceOf(parameter);
				switch (actualType) {
				case 'Array':
					return parameter.map(parameterToValidator);
				case 'Object':
					parameterValidator.keys('key', vKey => vKey.string()).try();

					return parameter.optional && instanceOf(this.value[parameter.key]) === 'undefined' ? null : new ValidatorChain(this.value[parameter.key], `${this.name}.${parameter.key}`).exist();
				case 'String':
					return new ValidatorChain(this.value[parameter], `${this.name}.${parameter}`).exist();
				default:
					throw Errors.invalidType({ name: parameterName, actualType, expectedType: 'Array|String|Object' });
				}
			} catch (cause) {
				throw cause instanceof Errors && cause.code === Errors.INVALID_TYPE ? cause : Errors.invalid({ name: parameterName, cause });
			}
		};

		try {
			if (this.isValid === true) {
				const [ [ apply ], parameters ] = _.partition(args, arg => isInstance(arg, 'Function'));
				const children = parameters.map(parameterToValidator);
				this.children.push(..._.compact(_.flattenDeep(children)));
				if (this.isValid === true && apply) {
					apply(...children);
				}
			}
		} catch (cause) {
			this.invalidate(Errors.programingFault({ reason: 'Children validation was interupted by unhandeled throws error', cause }));
		}

		return this;
	}

	try() {
		if (this._isValid !== true) {
			throw this.error;
		}
		try {
			this.children.forEach(child => child.try());
		} catch (cause) {
			throw Errors.invalid({ name: this.name, cause });
		}

		return this;
	}
}

const Validator = (...args) => new ValidatorChain(...args);


/**
 * @memberof Errors
 * @function internalError
 * @property {Number} CODE 1
 * @property {String} TAG INTERNAL_ERROR
 */
Errors.register('INTERNAL_ERROR', 1, '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function unexpectedError
 * @property {Number} CODE 2
 * @property {String} TAG UNEXPECTED_ERROR
 */
Errors.register('UNEXPECTED_ERROR', 2, '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function programingFault
 * @property {Number} CODE 3
 * @property {String} TAG PROGRAMING_FAULT
 */
Errors.register('PROGRAMING_FAULT', 3, '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function notYetImplemented
 * @property {Number} CODE 4
 * @property {String} TAG NOT_YET_IMPLEMENTED
 */
Errors.register('NOT_YET_IMPLEMENTED', 4, 'Feature(<%- name %>) is not yet implemented.<% if (locals.reason) { %><%- reason %><% } %>', [ 'name' ]);


/**
 * @memberof Errors
 * @function initialized
 * @property {Number} CODE 100
 * @property {String} TAG INITIALIZED
 */
Errors.register('INITIALIZED', 100, 'Resource(<%- name %>) is already initialized.', [ 'name' ]);
/**
 * @memberof Errors
 * @function notInitialized
 * @property {Number} CODE 101
 * @property {String} TAG NOT_INITIALIZED
 */
Errors.register('NOT_INITIALIZED', 101, 'Resource(<%- name %>) is not initialized.', [ 'name' ]);

/**
 * @memberof Errors
 * @function invalid
 * @property {Number} CODE 110
 * @property {String} TAG INVALID
 */
Errors.register('INVALID', 110, '<%- name %> is invalid.<% if (locals.reason) { %><%- reason %><% } %>', [ 'name' ]);
/**
 * @memberof Errors
 * @function invalidType
 * @property {Number} CODE 111
 * @property {String} TAG INVALID_TYPE
 */
Errors.register('INVALID_TYPE', 111, '<%- name %> as invalid type(<%- actualType %>) instead of (<%- expectedType %>).', [ 'name', 'actualType', 'expectedType' ]);

/**
 * @memberof Errors
 * @function exist
 * @property {Number} CODE 112
 * @property {String} TAG EXIST
 */
Errors.register('EXIST', 112, 'Resource(<%- name %>) exist.', [ 'name' ]);
/**
 * @memberof Errors
 * @function doesntExist
 * @property {Number} CODE 113
 * @property {String} TAG DOESNT_EXIST
 */
Errors.register('DOESNT_EXIST', 113, 'Resource(<%- name %>) doesn\'t exist.', [ 'name' ]);

/**
 * @memberof Errors
 * @function equal
 * @property {Number} CODE 114
 * @property {String} TAG EQUAL
 */
Errors.register('EQUAL', 114, '<%- name %>(<%- value %>) is forbidden', [ 'name', 'value' ]);
/**
 * @memberof Errors
 * @function notEqual
 * @property {Number} CODE 115
 * @property {String} TAG NOT_EQUAL
 */
Errors.register('NOT_EQUAL', 115, '<%- name %>(<%- actualValue %>) is not equal to <%- expectedValue %>', [ 'name', 'actualValue', 'expectedValue' ]);

/**
 * @memberof Errors
 * @function greaterThan
 * @property {Number} CODE 116
 * @property {String} TAG GREATER_THAN
 */
Errors.register('GREATER_THAN', 116, '<%- name %>(<%- value %>) is greater than <%- limit %>', [ 'name', 'value', 'limit' ]);
/**
 * @memberof Errors
 * @function notGreaterThan
 * @property {Number} CODE 117
 * @property {String} TAG NOT_GREATER_THAN
 */
Errors.register('NOT_GREATER_THAN', 117, '<%- name %>(<%- value %>) is not greater than <%- limit %>', [ 'name', 'value', 'limit' ]);
/**
 * @memberof Errors
 * @function lowerThan
 * @property {Number} CODE 118
 * @property {String} TAG LOWER_THAN
 */
Errors.register('LOWER_THAN', 118, '<%- name %>(<%- value %>) is lower than <%- limit %>', [ 'name', 'value', 'limit' ]);
/**
 * @memberof Errors
 * @function notLowerThan
 * @property {Number} CODE 119
 * @property {String} TAG NOT_LOWER_THAN
 */
Errors.register('NOT_LOWER_THAN', 119, '<%- name %>(<%- value %>) is not lower than <%- limit %>', [ 'name', 'value', 'limit' ]);

/**
 * @memberof Errors
 * @function included
 * @property {Number} CODE 120
 * @property {String} TAG INCLUDED
 */
Errors.register('INCLUDED', 120, '<%- name %>(<%- value %>) is included in <%- forbiddenValues %>', [ 'name', 'value', 'forbiddenValues' ]);
/**
 * @memberof Errors
 * @function notIncluded
 * @property {Number} CODE 121
 * @property {String} TAG NOT_INCLUDED
 */
Errors.register('NOT_INCLUDED', 121, '<%- name %>(<%- value %>) is not included in <%- possibleValues %>', [ 'name', 'value', 'possibleValues' ]);
/**
 * @memberof Errors
 * @function invalidFormat
 * @property {Number} CODE 122
 * @property {String} TAG INVALID_FORMAT
 */
Errors.register('INVALID_FORMAT', 122, '<%- name %>(<%- value %>) format is not valid(<%- format %>)', [ 'name', 'value', 'format' ]);


module.exports = Errors;
