import { expect } from 'chai';
import 'mocha';

import { Errors, Eratum } from '../sources/index';

describe('Erros unit tests', () => {
	describe('Registered error controls', () => {
		it('Errors.register(\'specificInvalid\') should create tag and constructor', () => {
			const tag = 'SPECIFIC_INVALID';
			const name = 'specificInvalid';
			Errors.register(name);

			expect(Errors.factory).to.property(name);
			expect(Errors.factory[name]).to.property('tag').equal(tag);
			expect(Errors.factory[name]).to.property('class');

			const error = Errors.factory[name]();
			expect(error.tag).equal(tag);
		});
		it('Errors.register(\'outOfBound\', ...) should create tag and constructor', () => {
			const tag = 'OUT_OF_BOUND';
			const name = 'outOfBound';
			Errors.register(name, 'Resource(<%= name %>) is out of bound(<%= bound %>)', ['name', 'bound']);

			expect(Errors.factory).to.property(name);
			expect(Errors.factory[name]).to.property('tag').equal(tag);
			expect(Errors.factory[name]).to.property('class');

			const error = Errors.factory[name]({ name: 'index', bound: 10 });
			expect(error.tag).equal(tag);
		});
		// it('Errors.register() should throw DOESNT_EXIST tag', () => {
		// 	try {
		// 		Errors.register();
		// 		should.fail(undefined, undefined, 'Should throw');
		// 	} catch (error) {
		// 		error.parameters.should.have.property('name').equal('tag');
		// 	}
		// });
		// it('Errors.register(42) should throw INVALID_TYPE tag', () => {
		// 	try {
		// 		Errors.register(42);
		// 		should.fail(undefined, undefined, 'Should throw');
		// 	} catch (error) {
		// 		error.parameters.should.have.property('name').equal('tag');
		// 	}
		// });
		it('Errors.register(\'OUT_OF_BOUND\') should throw INVALID_FORMAT error', () => {
			const name = 'OUT_OF_BOUND';
			try {
				Errors.register(name);
				expect.fail();
			} catch (error) {
				expect(error).instanceOf(Errors.factory.invalidFormat.class);
				expect(error.parameters).property('name').equal('name');
				expect(error.parameters).property('value').equal(`'${name}'`);
			}
		});
		it('Errors.register(\'invalidFormat\') should throw EXIST error', () => {
			const name = 'invalidFormat';
			try {
				Errors.register(name);
			} catch (error) {
				expect(error).instanceOf(Errors.factory.exist.class);
				expect(error.parameters).property('name').equal(`Errors.factory.${name}`);
			}
		});
	});

	describe('build error controls', () => {
		it('Errors.build(\'notInitialized\') should return NOT_INITIALIZED error', () => {
			const name = 'notInitialized';
			const error = Errors.build(name, { name: '' });
			expect(error).instanceOf(Errors.factory[name].class);
		});
		it('Errors.build(\'NOT_INITIALIZED\') should return NOT_INITIALIZED error', () => {
			const tag = 'NOT_INITIALIZED';
			const error = Errors.build(tag, { name: '' });
			expect(error).instanceOf(Eratum).property('tag').equals(tag);
		});
		// it('Errors.build({ foo: 42 }) should throw DOESNT_EXIST', () => {
		// 	try {
		// 		Errors.build({ foo: 42 }, { name: '' });
		// 		should.fail(undefined, undefined, 'Should throw');
		// 	} catch (error) {
		// 		error.should.have.property('tag');
		// 		error.tag.should.equal('DOESNT_EXIST');
		// 		error.parameters.should.have.property('name');
		// 		error.parameters.name.should.equal('Errors.');
		// 	}
		// });
		// it('Errors.doesntExist(\'notAnObject\') should throw invalidType(parameters)', () => {
		// 	try {
		// 		Errors.factory.doesntExist('notAnObject');
		// 		should.fail(undefined, undefined, 'Should throw');
		// 	} catch (error) {
		// 		error.parameters.should.have.property('name');
		// 		error.parameters.name.should.equal('parameters');
		// 	}
		// });
		it('Errors.exist() should throw DOESNT_EXIST error', () => {
			try {
				Errors.factory.exist();
				expect.fail();
			} catch (error) {
				expect(error).instanceOf(Errors.factory.invalid.class);
				expect(error.parameters).property('name').equal('parameters');
				expect(error.cause).instanceOf(Errors.factory.doesntExist.class);
				expect(error.cause.parameters).property('name').equal('parameters.name');
			}
		});
	});

	describe('Errors.get() return validation', () => {
		it('should build error object', () => {
			Eratum.isStackEnabled = true;
			const error = Errors.factory.internalError();
			const errorObj = error.get();
			expect(errorObj).property('message');
			expect(errorObj).property('tag').equals(Errors.factory.internalError.tag);
			expect(errorObj).property('stack');
		});
		it('should build neasted error with no object cause', () => {
			Eratum.isStackEnabled = true;
			const cause = 'notAnObject';
			const error = Errors.factory.internalError({ cause });
			const errorObj = error.get();
			expect(errorObj).property('message');
			expect(errorObj).property('tag').equals(Errors.factory.internalError.tag);
			expect(errorObj).property('stack');
			expect(errorObj).property('cause').equals(cause);
		});
		it('should build neasted error object', () => {
			Eratum.isStackEnabled = true;
			const message = 'Some bug';
			const error = Errors.factory.internalError({ cause: Errors.factory.internalError({ cause: new RangeError(message) }) });
			const errorObj = error.get();
			expect(errorObj).property('message');
			expect(errorObj).property('tag').equals(Errors.factory.internalError.tag);
			expect(errorObj).property('stack');
			expect(errorObj).property('cause').an('object');
			expect(errorObj.cause).property('message');
			expect(errorObj.cause).property('tag').equals(Errors.factory.internalError.tag);
			expect(errorObj.cause).property('stack');
			expect(errorObj.cause).property('cause').an('object');
			expect(errorObj.cause.cause).property('message').equals(message);
			expect(errorObj.cause.cause).property('stack');
		});
		it('should build neasted error object in production env', () => {
			Eratum.isStackEnabled = false;
			const message = 'Some bug';
			const error = Errors.factory.internalError({ cause: Errors.factory.internalError({ cause: new RangeError(message) }) });
			const errorObj = error.get();
			expect(errorObj).property('message');
			expect(errorObj).property('tag').equals(Errors.factory.internalError.tag);
			expect(errorObj).not.property('stack');
			expect(errorObj).property('cause').an('object');
			expect(errorObj.cause).property('message');
			expect(errorObj.cause).property('tag').equals(Errors.factory.internalError.tag);
			expect(errorObj.cause).not.property('stack');
			expect(errorObj.cause).property('cause').an('object');
			expect(errorObj.cause.cause).property('message').equals(message);
			expect(errorObj.cause.cause).not.property('stack');
		});
	});

	describe('Errors.parse()', () => {
		it('Invalid error should return self object', () => {
			// Errors.isStackEnabled = true;
			[undefined, 12, { a: 12, stack: true }, { message: 'bonjour', age: 14 }].forEach((invalidError) => {
				expect(Errors.parse(invalidError)).equals(invalidError);
			});
		});
		it('valid error should return Error object', () => {
			const errorObj = { message: 'bonjour' };
			const error = Errors.parse(errorObj);
			expect(error).instanceof(Error).property('message').equals(errorObj.message);
		});
		it('valid error array should return Error array', () => {
			const errorObjs = [{ message: 'bonjour' }, { message: 'coucou' }];
			const errors: Eratum[] = Errors.parse(errorObjs);
			errors.forEach((error, idx) => {
				expect(error).instanceof(Error).property('message').equals(errorObjs[idx].message);
			});
		});
		it('valid error should return Error object with stack', () => {
			const errorObj = { message: 'bonjour', stack: 'test' };
			const error = Errors.parse(errorObj);
			expect(error).instanceof(Error);
			expect(error).property('message').equals(errorObj.message);
			expect(error).property('stack').equals(errorObj.stack);
		});
		it('valid error should return Errors object', () => {
			const errorFactory = Errors.factory.exist;
			const error = { message: 'bonjour', tag: errorFactory.tag };
			const built = Errors.parse(error);
			expect(built).instanceof(errorFactory.class);
			expect(built).property('message').equals(error.message);
		});
		it('valid error should return Errors object with neasted cause', () => {
			const cause2Factory = Errors.factory.exist;
			const cause2 = { message: 'Mami', tag: cause2Factory.tag };
			const cause1Factory = Errors.factory.invalidFormat;
			const cause1 = { message: 'coucou', tag: cause1Factory.tag, cause: cause2 };
			const errorFactory = Errors.factory.invalid;
			const error = { message: 'bonjour', tag: errorFactory.tag, cause: cause1 };
			const built = Errors.parse(error);

			expect(built).instanceof(errorFactory.class);
			expect(built).property('message').equals(error.message);
			expect(built).property('cause').instanceOf(cause1Factory.class);
			expect(built.cause).property('message').equals(cause1.message);
			expect(built.cause).property('cause').instanceOf(cause2Factory.class);
			expect(built.cause.cause).property('message').equals(cause2.message);
		});
	});
});
