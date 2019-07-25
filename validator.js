const _ = require('lodash');
const util = require('util');

const Errors = require('./Errors.js');

function stringify(...args) {
	return args.map(item => util.inspect(item, { showHidden: false, depth: null })).join(', ');
}

function instanceOf(data) {
	return (data !== undefined && data !== null) ? data.constructor.name : 'undefined';
}

function isInstance(item, expectedInstance) {
	if (item === undefined || item === null) {
		return expectedInstance === 'undefined';
	}

	const isFinalInstance = [ 'Boolean', 'Number', 'String', 'Array', 'Object', 'Function' ];
	const proto = Object.getPrototypeOf(item);
	const type = instanceOf(proto);

	return (type === expectedInstance) || (!isFinalInstance.includes(type) && isInstance(proto, expectedInstance));
}

class Validator {
	constructor(value, name = '') {
		this.value = value;
		this.name = name;
		this.modifier = true;
		this.children = [ ];
		this._isValid = true;
		this.error = null;

		/* key words */
		this.must = this;
		this.have = this;
		this.has = this;
		this.been = this;
		this.be = this;
		this.is = this;
		this.are = this;
		this.a = this;
		this.an = this;
		this.and = this;
		this.of = this;
	}

	invalidate(error) {
		this._isValid = false;
		this.error = error;

		return this;
	}

	resetModifier() {
		this.modifier = true;

		return this;
	}

	get isValid() {
		return this._isValid && this.children.map(child => child.isValid).reduce((a, b) => a && b, true);
	}

	get not() {
		this.modifier = !this.modifier;

		return this;
	}

	invalidateOn(test, buildError, buildRevError) {
		if (this.isValid === true) {
			try {
				if (test() === this.modifier) {
					this.invalidate(this.modifier ? buildError() : buildRevError());
				}
			} catch (cause) {
				throw Errors.programingFault({ reason: 'Validation was interupted by unhandeled throws error', cause });
			}
		}

		return this.resetModifier();
	}

	exist() {
		return this.invalidateOn(() => instanceOf(this.value) === 'undefined',
			() => Errors.doesntExist({ name: this.name }),
			() => Errors.exist({ name: this.name }));
	}

	type(expectedType) {
		const actualType = typeof this.value;

		return this.invalidateOn(() => actualType !== expectedType,
			() => Errors.invalidType({ name: this.name, actualType, expectedType: `${expectedType}` }),
			() => Errors.invalidType({ name: this.name, actualType, expectedType: `!${expectedType}` }));
	}

	instance(...args) {
		const expectedTypes = _.flattenDeep(args);

		return this.invalidateOn(() => expectedTypes.map(expectedType => !isInstance(this.value, expectedType)).reduce((a, b) => a && b),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: `${expectedTypes.join(', ')}` }),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: `!${expectedTypes.join(', ')}` }));
	}

	match(regex) {
		return this.invalidateOn(() => !regex.test(this.value),
			() => Errors.invalidFormat({ name: this.name, value: stringify(this.value), format: `regex(${stringify(regex)})` }),
			() => Errors.invalidFormat({ name: this.name, value: stringify(this.value), format: `!regex(${stringify(regex)})` }));
	}

	boolean() {
		return this.instance('Boolean');
	}

	number() {
		return this.instance('Number');
	}

	string() {
		return this.instance('String');
	}

	object() {
		return this.instance('Object');
	}

	array() {
		return this.invalidateOn(() => !Array.isArray(this.value),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: 'Array' }),
			() => Errors.invalidType({ name: this.name, actualType: instanceOf(this.value), expectedType: '!Array' }));
	}

	each(apply) {
		try {
			if (this.isValid === true) {
				const children = this.value.map((child, idx) => new Validator(child, `${this.name}[${idx}]`));
				this.children.push(...children);
				children.forEach(apply);
			}
		} catch (cause) {
			this.invalidate(Errors.programingFault({ reason: 'Children validation interupted by unhandeled throws error', cause }));
		}

		return this;
	}

	keys(...args) {
		const parameterToValidator = (parameter, index) => {
			const parameterName = `parameter${index || ''}`;
			try {
				const parameterValidator = new Validator(parameter, parameterName);
				const actualType = instanceOf(parameter);
				switch (actualType) {
				case 'Array':
					return parameter.map(parameterToValidator);
				case 'Object':
					parameterValidator.keys('key', vKey => vKey.string()).try();

					return parameter.optional && instanceOf(this.value[parameter.key]) === 'undefined' ? null : new Validator(this.value[parameter.key], `${this.name}.${parameter.key}`).exist();
				case 'String':
					return new Validator(this.value[parameter], `${this.name}.${parameter}`).exist();
				default:
					throw Errors.invalidType({ name: parameterName, actualType, expectedType: 'Array|String|Object' });
				}
			} catch (cause) {
				throw cause instanceof Errors && cause.code === Errors.INVALID_TYPE ? cause : Errors.invalid({ name: parameterName, cause });
			}
		};

		try {
			if (this.isValid === true) {
				const [ [ apply ], parameters ] = _.partition(args, arg => isInstance(arg, 'Function'));
				const children = parameters.map(parameterToValidator);
				this.children.push(..._.compact(_.flattenDeep(children)));
				if (this.isValid === true && apply) {
					apply(...children);
				}
			}
		} catch (cause) {
			this.invalidate(Errors.programingFault({ reason: 'Children validation was interupted by unhandeled throws error', cause }));
		}

		return this;
	}

	try() {
		if (this._isValid !== true) {
			throw this.error;
		}
		try {
			this.children.forEach(child => child.try());
		} catch (cause) {
			throw Errors.invalid({ name: this.name, cause });
		}

		return this;
	}
}

module.exports = (...args) => new Validator(...args);
