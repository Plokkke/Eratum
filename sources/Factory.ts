import ejs from 'ejs';
import _ from 'lodash';

import { ValidatorFactory } from './IValidator';
import { EratumOptions, Eratum, EratumConstructor, IEratum, ChildEratumConstructor } from './Eratum';
export * from './Eratum';

interface IEratumFactoryItem {
	(parameters?: EratumOptions): Eratum;
	tag: string;
	class: ChildEratumConstructor<Eratum>;
}

interface IEratumFactory {
	Validator: ValidatorFactory | null;
	factory: {
		[key: string]: IEratumFactoryItem;
	};
	findFactory(identifier: string): IEratumFactoryItem;
	register(name: string, template?: string, requiredAttrs?: string[]): void;
	createFactoryItem(name: string, template: string, requiredAttrs: string[]): IEratumFactoryItem;
	build(name: string, parameters: EratumOptions): Eratum;
	parse(object: any)
		: typeof object extends IEratum ? Eratum
		: typeof object extends Error ? Error
		: typeof object;
}

// tslint:disable-next-line: variable-name
export const Errors: IEratumFactory = {
	Validator: null,
	factory: {},

	findFactory(identifier: string) {
		const itemFactory = this.factory[identifier] || _.find(this.factory, factory => factory.tag === identifier);
		if (!itemFactory) {
			throw Errors.factory.doesntExist({ name: `Errors.factory.${identifier}`, origin: 'Eratum' });
		}
		return itemFactory;
	},

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
	register(name: string, template: string = '', requiredAttrs: string[] = []): void {
		this.Validator!(name, 'name').exist().string().match(/^[a-z][a-zA-Z]*$/).try();
		this.Validator!(template, 'template').exist().string().try();
		this.Validator!(requiredAttrs, 'requiredAttrs').exist().array().each(child => child.instance('String')).try();
		this.Validator!(this.factory[name], `Errors.factory.${name}`).not.exist().try();

		this.factory[name] = this.createFactoryItem(name, template, requiredAttrs);
	},

	createFactoryItem(name: string, template: string, requiredAttrs: string[]): IEratumFactoryItem {
		const factoryItem = function (this: Function, parameters: EratumOptions = {}): Eratum { // Not use arrow syntax to avoid 'this' capture
			Errors.Validator!(parameters, 'parameters').object().keys(...requiredAttrs).try();

			const error = new (factoryItem.class)(`${factoryItem.tag}${template && ` - ${ejs.render(template, parameters)}`}`, parameters);
			Error.captureStackTrace(error, this);

			return error;
		} as IEratumFactoryItem;
		factoryItem.tag = _.snakeCase(name).toUpperCase();
		factoryItem.class = class extends Eratum {
			constructor(message: string, options: EratumOptions) { super(message, factoryItem.tag, options); }
		};
		return factoryItem;
	},

	/**
	 * Built an error by Tag or code
	 * @function Errors.build
	 * @memberof Errors
	 * @static
	 * @param  {String|Number} identifier [description]
	 * @param  {Object} parameters [description]
	 * @return {Errors}            [description]
	 */
	build(identifier: string, parameters: EratumOptions): Eratum {
		return this.findFactory(identifier)(parameters);
	},

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
	parse(object: any)
		: typeof object extends IEratum ? Eratum
		: typeof object extends Error ? Error
		: typeof object {
		let error = object;
		if (error && typeof error === 'object') {
			if (Array.isArray(error)) {
				return error.map(err => this.parse(err));
			}
			const { message, tag, cause, stack, ...parameters } = error;
			if (message && tag) {
				error = new (this.findFactory(tag).class)(message, { cause: this.parse(cause), ...parameters });
			} else if (message && !tag && !cause && !Object.keys(parameters).length) {
				error = new Error(message);
			}
			if (stack) {
				error.stack = stack;
			}
		}

		return error;
	},
};
