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
}

interface EratumFactory {
	[key: string]: EratumProducer;
}

// tslint:disable-next-line: variable-name
let Validator: ValidatorFactory;

// tslint:disable-next-line: variable-name
export const Errors: EratumFactory = {};

export function init(v: ValidatorFactory): void {
	Validator = v;
}

function setupProducer(tag: string, template: string, requiredAttrs: string[]): EratumProducer {
	// eslint-disable-next-line @typescript-eslint/ban-types
	const producer = function producer(this: Function, options: EratumOptions = {}): Eratum { // Not use arrow syntax to avoid 'this' capture
		Validator(options, 'options').exist().object().keys(...requiredAttrs).try();
		const { cause, origin, ...parameters } = options;
		const error = new Eratum(_.compact([ tag, ejs.render(template, options) ]).join(' - '), tag, parameters, cause, origin);
		Error.captureStackTrace(error, this);

		return error;
	};
	producer.tag = tag;
	return producer;
}

/**
 * Register error by name<br/>
 * @param {String} name Unique string name for this error type. Must be camel case (/^[a-z][a-zA-Z]*$/).
 * @param {String} [template=''] EJS template to build error message.
 * @param {Array<String>} [requiredAttrs=[]] Required attributes for previous EJS template. Rendering fail if those attributes are undefined.
 * @return {undefined}
 */

export function registerError(name: string, template = '', requiredAttrs: string[] = []): void {
	Validator(name, 'name').exist().string().match(/^[a-z][a-zA-Z]*$/).try();
	Validator(Errors[name], `Errors.${name}`).not.exist().try();
	Validator(template, 'template').exist().string().try();
	Validator(requiredAttrs, 'requiredAttrs').exist().array().each((child) => child.instance('String')).try();

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
export function parseError<T>(object: T[]): T extends IEratum ? Eratum[]
	: T extends { message: string } ? Error[]
	: T[];
export function parseError<T>(object: T): T extends IEratum ? Eratum
	: T extends { message: string } ? Error
	: T;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
function parseErrorItem(object: Record<string, unknown>): typeof object extends IEratum ? Eratum
	: typeof object extends { message: string } ? Error
	: typeof object {
	if (!object || typeof object !== 'object' || !object.message || typeof object.message !== 'string') {
		return object;
	}

	const { message, tag, cause, stack, module, ...parameters } = object;

	let error;
	if (tag && typeof tag === 'string') {
		error = new Eratum(message, tag, parameters, parseError(cause));
	} else {
		error = new Error(message);
	}
	if (stack && typeof stack === 'string') {
		error.stack = stack;
	}
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return error;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/adjacent-overload-signatures
export function parseError(object: any): any {
	return Array.isArray(object) ? object.map(parseErrorItem) : parseErrorItem(object);
}
