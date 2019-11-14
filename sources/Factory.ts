import ejs from 'ejs';
import _ from 'lodash';

import { ValidatorFactory } from './IValidator';
import { Eratum, IEratum } from './Eratum';

/**
 * Eratum constructor options
 */
export interface EratumOptions {
	cause?: any;
	origin?: string;
	[key: string]: any;
}

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
	const producerClass = class extends Eratum {
		public parameters: { [key: string]: any; };
		constructor(message: string, { cause, origin, ...parameters }: EratumOptions) {
			super(message, tag, cause, origin);
			this.parameters = parameters;
		}
	};
	const producer = function (this: Function, parameters: EratumOptions = {}): any { // Not use arrow syntax to avoid 'this' capture
		Validator(parameters, 'parameters').exist().object().keys(...requiredAttrs).try();
		const error = new producerClass(_.compact([tag, ejs.render(template, parameters)]).join(' - '), parameters);
		Error.captureStackTrace(error, this);

		return error;
	};
	producer.tag = tag;
	producer.class = producerClass;
	return producer;
}

/**
 * Register error by name<br/>
 * @param {String} name Unique string name for this error type. Must be camel case (/^[a-z][a-zA-Z]*$/).
 * @param {String} [template=''] EJS template to build error message.
 * @param {Array<String>} [requiredAttrs=[]] Required attributes for previous EJS template. Rendering fail if those attributes are undefined.
 * @return {undefined}
 */

export function registerError(name: string, template: string = '', requiredAttrs: string[] = []): void {
	Validator(name, 'name').exist().string().match(/^[a-z][a-zA-Z]*$/).try();
	Validator(Errors[name], `Errors.${name}`).not.exist().try();
	Validator(template, 'template').exist().string().try();
	Validator(requiredAttrs, 'requiredAttrs').exist().array().each(child => child.instance('String')).try();

	Errors[name] = setupProducer(_.snakeCase(name).toUpperCase(), template, requiredAttrs);
}

/**
 * Build Eratum or Error from plain object returned by get.<br/>
 * Use for serialize / unserialize.<br/>
 * Return parameter if parse fail.<br/>
 *
 * @param {Object} object Object to parse.
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
