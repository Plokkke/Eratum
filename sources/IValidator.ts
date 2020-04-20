export type TypeOf = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';
export type ChainApplier = (validator: IValidator) => void;
export type PropsApplier = { key: string; chain: ChainApplier; optional?: boolean } | string;
export type SafePropsApplier = { key: string; chain: ChainApplier; optional: boolean };

export interface IValidator {
	must: this;
	have: this;
	has: this;
	been: this;
	be: this;
	is: this;
	are: this;
	a: this;
	an: this;
	and: this;
	of: this;
	readonly not: this;

	value: any;
	name: string;

	readonly isValid: boolean;
	readonly error: Error | null;

	setModifier(modifier: boolean): this;
	resetModifier(): this;
	apply(chain: ChainApplier): this;
	exist(): this;
	instance(expectedType: string | Function): this;
	match(regex: RegExp): this;
	string(): this;
	object(): this;
	array(): this;
	function(): this;
	or(...args: ChainApplier[]): this;
	each(apply: ChainApplier): this;
	keys(...args: PropsApplier[]): this;
	try(): this;
}

export type ValidatorFactory = (value: any, name: string) => IValidator;
