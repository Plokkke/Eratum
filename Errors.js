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
		const Validator = require('./validator.js');
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

module.exports = Errors;
