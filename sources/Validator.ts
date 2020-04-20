import _ from 'lodash';
import util from 'util';

import { IValidator, ChainApplier, PropsApplier, SafePropsApplier, TypeOf } from './IValidator';
import { Errors } from './Factory';

export type ErrorBuilder = () => Error;
export type Checker<T> = (value: T) => boolean;

function stringify(...args: any[]): string {
	return args.map((item) => util.inspect(item, { showHidden: false, depth: null })).join(', ');
}

function instanceOf(data: any): string {
	return (data !== undefined && data !== null) ? data.constructor.name : 'undefined';
}

function isInstance(item: any, expectedInstance: TypeOf | string | Function): boolean {
	if (item === undefined || item === null) {
		return expectedInstance === 'undefined';
	}

	if (typeof expectedInstance === 'function') {
		return item instanceof expectedInstance;
	}

	const isFinalInstance = [ 'Boolean', 'Number', 'String', 'Array', 'Object', 'Function' ];
	const proto = Object.getPrototypeOf(item);
	const type = instanceOf(proto);

	return (type === expectedInstance) || (!isFinalInstance.includes(type) && isInstance(proto, expectedInstance));
}

class Validator implements IValidator {
	public must = this;
	public have = this;
	public has = this;
	public been = this;
	public be = this;
	public is = this;
	public are = this;
	public a = this;
	public an = this;
	public and = this;
	public of = this;

	protected modifier = true;
	protected children: Validator[] = [];
	// tslint:disable-next-line: variable-name
	private _error: Error | null = null;

	constructor(
		public value: any,
		public name: string = '',
	) { }

	static create(...args: [any, string]): Validator {
		return new Validator(...args);
	}

	get isValid(): boolean {
		return !this._error && (this.children.find((child) => !child.isValid) === undefined);
	}

	get error(): Error | null {
		if (this._error) {
			return this._error;
		}
		const childrenErrors = this.children.map((child) => child.error).filter((error) => !!error);
		if (childrenErrors.length) {
			if (childrenErrors.length === 1) {
				return Errors.invalid({ name: this.name, cause: childrenErrors[0] });
			}
			return Errors.invalid({ name: this.name, cause: childrenErrors });
		}

		return null;
	}

	invalidate(error: Error): this {
		this._error = error;

		return this;
	}

	invalidateOn(check: Checker<any>, buildError: ErrorBuilder, buildRevError: ErrorBuilder): this {
		if (this.isValid) {
			try {
				if (check(this.value) === this.modifier) {
					const builder = this.modifier ? buildError : (buildRevError || buildError);
					this.invalidate(builder());
				}
			} catch (cause) {
				throw Errors.programingFault({ reason: 'Validation was interupted by unhandeled throws error', cause });
			}
		}

		return this.resetModifier();
	}

	setModifier(modifier: boolean): this {
		this.modifier = modifier;

		return this;
	}

	/**
	 * Set modifier back to true (normal validation).
	 * @return {this} this for chaining.
	 */
	resetModifier(): this {
		return this.setModifier(true);
	}

	get not(): this {
		this.modifier = !this.modifier;

		return this;
	}

	apply(chain: ChainApplier): this {
		try {
			chain(this);
		} catch (cause) {
			this.invalidate(Errors.programingFault({ reason: 'Validation was interupted by unhandeled throws error', cause }));
		}
		return this;
	}

	exist(): this {
		return this.invalidateOn(() => instanceOf(this.value) === 'undefined',
			() => Errors.doesntExist({ name: this.name }),
			() => Errors.exist({ name: this.name }));
	}

	instance(expectedType: string | Function): this {
		return this.invalidateOn(() => !isInstance(this.value, expectedType),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: `${expectedType}` }),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: `!${expectedType}` }));
	}

	match(regex: RegExp): this {
		return this.invalidateOn(() => !regex.test(this.value),
			() => Errors.invalidFormat({ name: this.name, value: stringify(this.value), format: `regex(${stringify(regex)})` }),
			() => Errors.invalidFormat({ name: this.name, value: stringify(this.value), format: `!regex(${stringify(regex)})` }));
	}

	string(): this {
		return this.instance('String');
	}

	object(): this {
		return this.instance('Object');
	}

	array(): this {
		return this.invalidateOn(() => !Array.isArray(this.value),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: 'Array' }),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: '!Array' }));
	}

	function(): this {
		return this.instance('Function');
	}

	or(...args: ChainApplier[]): this {
		Validator.create(args, 'or.args').each((vChain) => vChain.function()).try();

		if (!this.modifier) {
			throw Errors.programingFault({ reason: '"or" should not be use with not modifier' });
		}

		try {
			if (this.isValid) {
				const errors = _.compact(args.map((apply) => Validator.create(this.value, this.name).apply(apply).error));

				if (errors.length === args.length) {
					this.invalidate(Errors.invalid({ name: this.name, cause: errors }));
				}
			}
		} catch (cause) {
			this.invalidate(Errors.programingFault({ reason: '"or" validation was interupted by unhandeled throws error', cause }));
		}

		return this;
	}

	each(apply: ChainApplier): this {
		if (!this.modifier) {
			throw Errors.programingFault({ reason: '"each" should not be use with not modifier' });
		}

		try {
			if (this.isValid) {
				const children = this.value.map((child: any, idx: number) => Validator.create(child, `${this.name}[${idx}]`));
				this.children.push(...children);
				children.forEach(apply);
			}
		} catch (cause) {
			this.invalidate(Errors.programingFault({ reason: 'Children validation interupted by unhandeled throws error', cause }));
		}

		return this;
	}

	keys(...args: PropsApplier[]): this {
		if (!this.modifier) {
			throw Errors.programingFault({ reason: '"keys" should not be use with not modifier' });
		}

		try {
			const appliers: SafePropsApplier[] = _.compact(args).map((arg, idx) => {
				let applier: any = {
					chain: (v: Validator) => v.exist(),
					optional: false,
				};

				switch (typeof arg) {
				case 'string': applier = { ...applier, key: arg }; break;
				case 'object': applier = { ...applier, ...arg }; break;
				default: throw Errors.invalidType({ name: `appliers[${idx}]`, actualType: instanceOf(arg), expectedType: 'String|Object' });
				}
				return applier as SafePropsApplier;
			});

			if (this.isValid) {
				this.children.push(
					...appliers.filter(({ key, optional }) => !optional || this.value[key])
						.map(({ key, chain }) => Validator.create(this.value[key], `${this.name}.${key}`).apply(chain)),
				);
			}
		} catch (cause) {
			this.invalidate(Errors.programingFault({ reason: '"keys" validation was interupted by unhandeled throws error', cause }));
		}

		return this;
	}

	try(): this {
		if (!this.isValid) {
			throw this.error;
		}
		return this;
	}
}

export default (...args: [any, string]): IValidator => new Validator(...args);
