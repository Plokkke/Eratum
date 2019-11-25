import { expect } from 'chai';
import 'mocha';

import Errors, { Eratum, registerError, parseError } from '../sources/index';

describe('Typescript Errors unit tests', () => {
	describe('Registered error controls', () => {
		it('registerError(\'specificInvalid\') should create tag and constructor', () => {
			const tag = 'SPECIFIC_INVALID';
			const name = 'specificInvalid';
			registerError(name);

			expect(Errors).to.property(name);
			expect(Errors[name]).to.property('tag').equal(tag);
			expect(Errors[name]).to.property('class');

			const error = Errors[name]();
			expect(error.tag).equal(tag);
		});
		it('register should generate unique class', () => {
			const error = Errors.programingFault();
			expect(Errors.programingFault.class).not.equal(Errors.internalError.class);
			expect(error).instanceOf(Errors.programingFault.class);
			expect(error).not.instanceOf(Errors.internalError.class);
		});
		it('registerError(\'outOfBound\', ...) should create tag and constructor', () => {
			const tag = 'OUT_OF_BOUND';
			const name = 'outOfBound';
			registerError(name, 'Resource(<%= name %>) is out of bound(<%= bound %>)', ['name', 'bound']);

			expect(Errors).to.property(name);
			expect(Errors[name]).to.property('tag').equal(tag);
			expect(Errors[name]).to.property('class');

			const error = Errors[name]({ name: 'index', bound: 10 });
			expect(error.tag).equal(tag);
		});
		it('registerError(\'OUT_OF_BOUND\') should throw INVALID_FORMAT error', () => {
			const name = 'OUT_OF_BOUND';
			try {
				registerError(name);
				expect.fail();
			} catch (error) {
				expect(error).instanceOf(Errors.invalidFormat.class);
				expect(error.parameters).property('name').equal('name');
				expect(error.parameters).property('value').equal(`'${name}'`);
			}
		});
		it('registerError(\'invalidFormat\') should throw EXIST error', () => {
			const name = 'invalidFormat';
			try {
				registerError(name);
			} catch (error) {
				expect(error).instanceOf(Errors.exist.class);
				expect(error.parameters).property('name').equal(`Errors.${name}`);
			}
		});
	});

	describe('Produce error controls', () => {
		it('Errors.exist() should throw DOESNT_EXIST error', () => {
			try {
				Errors.exist();
				expect.fail();
			} catch (error) {
				expect(error).instanceOf(Errors.invalid.class);
				expect(error.parameters).property('name').equal('parameters');
				expect(error.cause).instanceOf(Errors.doesntExist.class);
				expect(error.cause.parameters).property('name').equal('parameters.name');
			}
		});
	});

	describe('Errors.get() return validation', () => {
		it('Should build error object', () => {
			Eratum.isStackEnabled = true;
			const error = Errors.internalError();
			const errorObj = error.get();
			expect(errorObj).property('message');
			expect(errorObj).property('tag').equals(Errors.internalError.tag);
			expect(errorObj).property('stack');
		});
		it('Should build neasted error with no object cause', () => {
			Eratum.isStackEnabled = true;
			const cause = 'notAnObject';
			const error = Errors.internalError({ cause });
			const errorObj = error.get();
			expect(errorObj).property('message');
			expect(errorObj).property('tag').equals(Errors.internalError.tag);
			expect(errorObj).property('stack');
			expect(errorObj).property('cause').equals(cause);
		});
		it('Should build neasted error object', () => {
			Eratum.isStackEnabled = true;
			const message = 'Some bug';
			const error = Errors.internalError({ cause: Errors.internalError({ cause: new RangeError(message) }) });
			const errorObj = error.get();
			expect(errorObj).property('message');
			expect(errorObj).property('tag').equals(Errors.internalError.tag);
			expect(errorObj).property('stack');
			expect(errorObj).property('cause').an('object');
			expect(errorObj.cause).property('message');
			expect(errorObj.cause).property('tag').equals(Errors.internalError.tag);
			expect(errorObj.cause).property('stack');
			expect(errorObj.cause).property('cause').an('object');
			expect(errorObj.cause.cause).property('message').equals(message);
			expect(errorObj.cause.cause).property('stack');
		});
		it('Should build neasted error object in production env', () => {
			Eratum.isStackEnabled = false;
			const message = 'Some bug';
			const error = Errors.internalError({ cause: Errors.internalError({ cause: new RangeError(message) }) });
			const errorObj = error.get();
			expect(errorObj).property('message');
			expect(errorObj).property('tag').equals(Errors.internalError.tag);
			expect(errorObj).not.property('stack');
			expect(errorObj).property('cause').an('object');
			expect(errorObj.cause).property('message');
			expect(errorObj.cause).property('tag').equals(Errors.internalError.tag);
			expect(errorObj.cause).not.property('stack');
			expect(errorObj.cause).property('cause').an('object');
			expect(errorObj.cause.cause).property('message').equals(message);
			expect(errorObj.cause.cause).not.property('stack');
		});
		it('Should build neasted error object with array cause', () => {
			const message = 'Some bug';
			const error = Errors.internalError({ cause: [Errors.internalError(), new RangeError(message), 42] });
			const errorObj = error.get();

			expect(errorObj).property('message');
			expect(errorObj).property('tag').equals(Errors.internalError.tag);
			expect(errorObj).property('cause').an('array').property('length').equal(3);
			expect(errorObj.cause[0]).an('object');
			expect(errorObj.cause[0]).property('message');
			expect(errorObj.cause[0]).property('tag').equals(Errors.internalError.tag);
			expect(errorObj.cause[1]).an('object');
			expect(errorObj.cause[1]).property('message').equals(message);
			expect(errorObj.cause[2]).a('number');
		});
	});

	describe('parseError()', () => {
		it('Invalid error should return self object', () => {
			// Errors.isStackEnabled = true;
			[undefined, 12, { a: 12, stack: true }, { message: 'bonjour', age: 14 }].forEach((invalidError) => {
				expect(parseError(invalidError)).equals(invalidError);
			});
		});
		it('Valid error should return Error object', () => {
			const errorObj = { message: 'bonjour' };
			const error = parseError(errorObj);
			expect(error).instanceof(Error).property('message').equals(errorObj.message);
		});
		it('Valid error array should return Error array', () => {
			const errorObjs = [{ message: 'bonjour' }, { message: 'coucou' }];
			const errors: Eratum[] = parseError(errorObjs);
			errors.forEach((error, idx) => {
				expect(error).instanceof(Error).property('message').equals(errorObjs[idx].message);
			});
		});
		it('Valid error should return Error object with stack', () => {
			const errorObj = { message: 'bonjour', stack: 'test' };
			const error = parseError(errorObj);
			expect(error).instanceof(Error);
			expect(error).property('message').equals(errorObj.message);
			expect(error).property('stack').equals(errorObj.stack);
		});
		it('Valid error should return Eratum object', () => {
			const errorFactory = Errors.exist;
			const error = { message: 'bonjour', tag: errorFactory.tag };
			const built = parseError(error);
			expect(built).instanceof(errorFactory.class);
			expect(built).property('message').equals(error.message);
		});
		it('Invalid error should throw doesntExist error', () => {
			const errorProducer = Errors.doesntExist;
			const unknowTag = 'UNKNOWN_TAG';
			try {
				parseError({ message: 'bonjour', tag: unknowTag });
			} catch (error) {
				expect(error).instanceOf(errorProducer.class);
				expect(error).property('tag').equal(errorProducer.tag);
				expect(error).property('parameters').a('object');
				expect(error.parameters).property('name').equal(`Errors.${unknowTag}`);
			}
		});
		it('Valid error should return Eratum object with neasted cause', () => {
			const cause2Factory = Errors.exist;
			const cause2 = { message: 'Mami', tag: cause2Factory.tag };
			const cause1Factory = Errors.invalidFormat;
			const cause1 = { message: 'coucou', tag: cause1Factory.tag, cause: cause2 };
			const errorFactory = Errors.invalid;
			const error = { message: 'bonjour', tag: errorFactory.tag, cause: cause1 };
			const built = parseError(error);

			expect(built).instanceof(errorFactory.class);
			expect(built).property('message').equals(error.message);
			expect(built).property('cause').instanceOf(cause1Factory.class);
			expect(built.cause).property('message').equals(cause1.message);
			expect(built.cause).property('cause').instanceOf(cause2Factory.class);
			expect(built.cause.cause).property('message').equals(cause2.message);
		});
	});
});
