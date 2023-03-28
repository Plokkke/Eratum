import _ from 'lodash';

/**
 * JSON serialization of Eratum object
 */
export interface IEratum {
	tag: string;
	message: string;
	cause?: any;
	origin?: string;
	stack?: string;
	parameters?: { [key: string]: any };
}

function serializeError(error: any, isStackEnabled: boolean): typeof error extends (infer U)[]
	? (U extends Error ? IEratum[] : U[])
	: (typeof error extends Error ? number : typeof error) {
	if (Array.isArray(error)) {
		return error.map((err) => serializeError(err, isStackEnabled));
	}

	if (error instanceof Error) {
		return _.pickBy({
			tag: 'INTERNAL_ERROR',
			message: error.message,
			...isStackEnabled && { stack: error.stack },
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			...error instanceof Eratum && {
				tag: error.tag,
				parameters: error.parameters,
				cause: serializeError(error.cause, isStackEnabled),
				origin: error.origin,
			},
		}, Boolean);
	}

	return error;
}

/**
 * @extends Error
 * @param {String} message Human readable message explaining error.
 * @param {String} tag Unique string identifier for this error type. Must be capitalized snake case (/^[A-Z_]*$/).
 * @param {Eratum|Eratum[]} cause Previous Error generating this one.
 * @param {String} origin Human readable hint about thrower. (capitalized snake case recommended)
 */
export class Eratum extends Error implements IEratum {
	/**
	 * Define if stack trace should be included in serialization or not.
	 */
	static isStackEnabled = (process.env.NODE_ENV === 'development');
	/**
	 * Prefix for origin. Use it for processus identifier.
	 */
	static origin = '';

	constructor(
		message: string,
		public readonly tag: string,
		public readonly parameters: { [key: string]: any },

		public readonly cause: any = null,
		private readonly module: string = '',
	) {
		super(message);
	}

	get origin(): string {
		return _.compact([ Eratum.origin, this.module ]).join('_');
	}

	get deepTag(): string {
		const causeDeepTag = this.cause
			? `#${this.cause instanceof Eratum ? this.cause.deepTag : Object.getPrototypeOf(this.cause).constructor.name}`
			: '';
		return `${this.tag}${causeDeepTag}`;
	}

	/**
	 * Serilize error in JSON ready object.
	 *
	 * @param {boolean} [isStackEnabled=Eratum.isStackEnabled] change default value
	 * @return {IEratum} Raw object
	 */
	get(isStackEnabled: boolean = Eratum.isStackEnabled): IEratum {
		return serializeError(this, isStackEnabled);
	}
}

/**
 * Eratum constructor signature
 */
export type EratumConstructor = { new(message: string, tag: string, cause?: any, origin?: string): Eratum };
