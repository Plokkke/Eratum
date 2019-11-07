import ejs from 'ejs';
import _ from 'lodash';

import { ValidatorFactory } from './IValidator';
import { EratumOptions, Eratum, IEratum } from './Eratum';

interface EratumProducer {
	(parameters?: EratumOptions): Eratum;
	tag: string;
	class: { new(message: string, options: EratumOptions): Eratum };
}

interface EratumFactory {
	[key: string]: EratumProducer;
}

// tslint:disable-next-line: variable-name
let Validator: ValidatorFactory;

// tslint:disable-next-line: variable-name
export const Errors: EratumFactory = {};

export function init(v: ValidatorFactory) {
	Validator = v;
}

function findFactory(identifier: string) {
	const itemFactory = Errors[identifier] || _.find(Errors, producer => producer.tag === identifier);
	if (!itemFactory) {
		throw Errors.doesntExist({ name: `Errors.${identifier}`, origin: 'Eratum' });
	}
	return itemFactory;
}

function setupProducer(tag: string, template: string, requiredAttrs: string[]): EratumProducer {
	const producer = function (this: Function, parameters: EratumOptions = {}): Eratum { // Not use arrow syntax to avoid 'this' capture
		Validator(parameters, 'parameters').object().keys(...requiredAttrs).try();
		const error = new (producer.class)(`${tag}${template && ` - ${ejs.render(template, parameters)}`}`, parameters);
		Error.captureStackTrace(error, this);

		return error;
	} as EratumProducer;
	producer.tag = tag;
	producer.class = class extends Eratum {
		constructor(message: string, options: EratumOptions) { super(message, producer.tag, options); }
	};
	return producer;
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

export function registerError(name: string, template: string = '', requiredAttrs: string[] = []): void {
	Validator(name, 'name').exist().string().match(/^[a-z][a-zA-Z]*$/).try();
	Validator(template, 'template').exist().string().try();
	Validator(requiredAttrs, 'requiredAttrs').exist().array().each(child => child.instance('String')).try();
	Validator(Errors[name], `Errors.${name}`).not.exist().try();

	Errors[name] = setupProducer(_.snakeCase(name).toUpperCase(), template, requiredAttrs);
}

/**
 * Build Eratum or Error from plain object returned by get.<br/>
 * Use for serialize / unserialize.<br/>
 * Return parameter if parse fail.<br/>
 *
 * @function Eratum.parse
 * @memberof Eratum
 * @static
 * @param  {Object} object Object to parse.
 * @return {Eratum|Error|*} Rebuilt error
 */

export function parseError(object: any)
	: typeof object extends IEratum ? Eratum
	: typeof object extends Error ? Error
	: typeof object {
	let error = object;
	if (error && typeof error === 'object') {
		if (Array.isArray(error)) {
			return error.map(parseError);
		}
		const { message, tag, cause, stack, ...parameters } = error;
		if (message && tag) {
			error = new (findFactory(tag).class)(message, { cause: parseError(cause), ...parameters });
		} else if (message && !tag && !cause && !Object.keys(parameters).length) {
			error = new Error(message);
		}
		if (stack) {
			error.stack = stack;
		}
	}

	return error;
}
