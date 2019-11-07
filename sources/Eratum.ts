import _ from 'lodash';

import { insertIf } from './utils';

export interface EratumOptions {
	cause?: any;
	origin?: string | null;
	[key: string]: any;
}

export interface IEratum {
	tag: string;
	message: string;
	cause?: Eratum | any;
	origin?: string | null;
	stack?: string;
}

export type EratumConstructor = { new(message: string, tag: string, options: EratumOptions): Eratum };
export type ChildEratumConstructor<T extends Eratum> = { new(message: string, options: EratumOptions): T };

/**
 * @extends Error
 * @param {String} tag Unique string identifier for this error type. Must be capitalized snake case (/^[A-Z_]*$/).
 * @param {String} template EJS template to build error message.
 * @param {Object} parameters EJS parameters for template rendering.
 * @param {Eratum|Error|*} cause Previous Error generating this one.
 */
export class Eratum extends Error implements IEratum {
	static isStackEnabled = (process.env.NODE_ENV === 'development');
	static origin = '';

	public cause: any;
	public origin: string | null;
	public parameters: object;

	constructor(
		message: string,
		public tag: string,
		{ cause = null, origin = null, ...parameters }: EratumOptions,
	) {
		super(message);

		this.cause = cause;
		this.origin = origin;
		this.parameters = parameters;
	}

	/**
	 * Build an simplified object with code, tag, message, cause(if exists) and stack trace(if enable)
	 *
	 * @return {Object} Raw object
	 */
	get(): IEratum {
		return {
			tag: this.tag,
			message: this.message,
			...this.cause && { cause: Eratum.get(this.cause) },
			...(Eratum.origin || this.origin) && { origin: _.compact([Eratum.origin, this.origin]).join('_') },
			...Eratum.isStackEnabled && { stack: this.stack },
		};
	}

	/**
	 * Build a simplified object as instance.get(), handle native Error, return parameter if not an Error.
	 *
	 *  @function Eratum.get
	 * @memberof Eratum
	 * @static
	 * @param  {Eratum|Error|*} error Native Error, Enhanced Error, or any.
	 * @return {Object} Simplified object
	 */
	static get(error: any): typeof error extends Error ? number : any {
		if (error instanceof Eratum) {
			return error.get();
		}
		if (error instanceof Error) {
			const e = _.pick(error, ['message', ...insertIf(Eratum.isStackEnabled, 'stack')]);
			return e;
		}

		if (Array.isArray(error)) {
			return error.map(err => Eratum.get(err));
		}

		return error;
	}

}
