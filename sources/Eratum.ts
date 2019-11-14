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
}

function serializeError(error: any, isStackEnabled: boolean): typeof error extends (infer U)[]
	? (U extends Error ? IEratum[] : U[])
	: (typeof error extends Error ? number : typeof error) {
	if (Array.isArray(error)) {
		return error.map(err => serializeError(err, isStackEnabled));
	}

	if (error instanceof Error) {
		return _.pickBy({
			tag: 'INTERNAL_ERROR',
			message: error.message,
			...isStackEnabled && { stack: error.stack },
			...error instanceof Eratum && {
				tag: error.tag,
				cause: serializeError(error.cause, isStackEnabled),
				origin: error.origin,
			},
		}, Boolean);
	}

	return error;

}

/**
 * Eratum constructor signature
 */
export type EratumConstructor = { new(message: string, tag: string, cause?: any, origin?: string): Eratum };

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
		public tag: string,
		public cause: any = null,
		private module: string = '',
	) { super(message); }

	get origin() {
		return _.compact([Eratum.origin, this.module]).join('_');
	}

	/**
	 * Serilize error in JSON ready object.
	 *
	 * @return {IEratum} Raw object
	 */
	get(isStackEnabled: boolean = Eratum.isStackEnabled): IEratum {
		return serializeError(this, isStackEnabled);
	}
}
