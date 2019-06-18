const should = require('should');

const Errors = require('../index.js');

describe('Erros unit tests', () => {
	describe('Registered error controls', () => {
		it('Errors.register(\'OUT_OF_BOUND\', ...) should create code, tag and constructor', () => {
			const tag = 'OUT_OF_BOUND';
			const code = 1000;
			Errors.register(tag, code, 'Resource(<%= name %>) is out of bound(<%= bound %>)', [ 'name', 'bound' ]);

			Errors.should.have.property(tag).equals(code);
			Errors.tags.should.have.property(code).equals(tag);

			Errors.should.have.property('outOfBound');
			const error = Errors.outOfBound({ name: 'index', bound: 10 });
			error.tag.should.equals(tag);
			error.code.should.equals(code);
		});
		it('Errors.register(\'SPECIF_1000\', ...) should create code, tag and constructor', () => {
			const tag = 'SPECIF_INVALID';
			const code = 'SPECIF_1000';
			Errors.register(tag, code);

			Errors.should.have.property(tag).equals(code);
			Errors.tags.should.have.property(code).equals(tag);

			Errors.should.have.property('specifInvalid');
			const error = Errors.specifInvalid();
			error.tag.should.equals(tag);
			error.code.should.equals(code);
		});
		it('Errors.register() should throw DOESNT_EXIST tag', () => {
			try {
				Errors.register();
				should.fail(undefined, undefined, 'Should throw');
			} catch (error) {
				error.should.have.property('code').equal(Errors.DOESNT_EXIST);
				error.parameters.should.have.property('name').equal('tag');
			}
		});
		it('Errors.register(42) should throw INVALID_TYPE tag', () => {
			try {
				Errors.register(42);
				should.fail(undefined, undefined, 'Should throw');
			} catch (error) {
				error.should.have.property('code').equal(Errors.INVALID_TYPE);
				error.parameters.should.have.property('name').equal('tag');
			}
		});
		it('Errors.register(\'lowerCaseTag\') should throw INVALID tag', () => {
			try {
				Errors.register('lowerCaseTag');
				should.fail(undefined, undefined, 'Should throw');
			} catch (error) {
				error.should.have.property('code').equal(Errors.INVALID_FORMAT);
				error.parameters.should.have.property('name').equal('tag');
			}
		});
		it('Errors.register(\'NEW_TAG\') should throw DOESNT_EXIST code', () => {
			try {
				Errors.register('NEW_TAG');
				should.fail(undefined, undefined, 'Should throw');
			} catch (error) {
				error.should.have.property('code').equal(Errors.DOESNT_EXIST);
				error.parameters.should.have.property('name').equal('code');
			}
		});
		it('Errors.register(\'NEW_TAG\', true) should throw INVALID_TYPE code', () => {
			try {
				Errors.register('NEW_TAG', true);
				should.fail(undefined, undefined, 'Should throw');
			} catch (error) {
				error.should.have.property('code').equal(Errors.INVALID_TYPE);
				error.parameters.should.have.property('name').equal('code');
			}
		});
		it('Errors.register(\'NOT_INITIALIZED\', 21) should throw ALREADY_EXISTS', () => {
			try {
				Errors.register('NOT_INITIALIZED', 21);
				should.fail(undefined, undefined, 'Should throw');
			} catch (error) {
				error.should.have.property('code').equal(Errors.EXIST);
				error.parameters.should.have.property('name').equal('Errors.NOT_INITIALIZED');
			}
		});
		it('Errors.register(\'NEW_TAG\', Errors.NOT_INITIALIZED) should throw EXIST', () => {
			try {
				Errors.register('NEW_TAG', Errors.NOT_INITIALIZED);
				should.fail(undefined, undefined, 'Should throw');
			} catch (error) {
				error.should.have.property('code').equal(Errors.EXIST);
				error.parameters.should.have.property('name').equal(`Errors.tags[${Errors.NOT_INITIALIZED}]`);
			}
		});
	});

	describe('build error controls', () => {
		it('Errors.build(Error.NOT_INITIALIZED) should return new Error with tag(NOT_INITIALIZED)', () => {
			const error = Errors.build(Errors.NOT_INITIALIZED, { name: '' });
			error.should.have.property('code');
			error.code.should.equal(Errors.NOT_INITIALIZED);
			error.parameters.should.have.property('name');
		});
		it('Errors.build(\'NOT_INITIALIZED\') should return new Error with tag(NOT_INITIALIZED)', () => {
			const error = Errors.build('NOT_INITIALIZED', { name: '' });
			error.should.have.property('code');
			error.code.should.equal(Errors.NOT_INITIALIZED);
			error.parameters.should.have.property('name');
		});
		it('Errors.build({ foo: 42 }) should throw DOESNT_EXIST', () => {
			try {
				Errors.build({ foo: 42 }, { name: '' });
				should.fail(undefined, undefined, 'Should throw');
			} catch (error) {
				error.should.have.property('tag');
				error.tag.should.equal('DOESNT_EXIST');
				error.should.have.property('code');
				error.code.should.equal(Errors.DOESNT_EXIST);
				error.parameters.should.have.property('name');
				error.parameters.name.should.equal('Errors.');
			}
		});
		it('Errors.doesntExist(\'notAnObject\') should throw invalidType(parameters)', () => {
			try {
				Errors.doesntExist('notAnObject');
				should.fail(undefined, undefined, 'Should throw');
			} catch (error) {
				error.should.have.property('code');
				error.code.should.equal(Errors.INVALID_TYPE);
				error.parameters.should.have.property('name');
				error.parameters.name.should.equal('parameters');
			}
		});
		it('Errors.exist() should throw doesntExist(parameters.name)', () => {
			try {
				Errors.exist();
				should.fail(undefined, undefined, 'Should throw');
			} catch (error) {
				error.should.have.property('code');
				error.code.should.equal(Errors.INVALID);
				error.parameters.should.have.property('name');
				error.parameters.name.should.equal('parameters');
				error.should.have.property('cause');
				error.cause.should.have.property('code');
				error.cause.code.should.equal(Errors.DOESNT_EXIST);
				error.cause.parameters.should.have.property('name');
				error.cause.parameters.name.should.equal('parameters.name');
			}
		});
	});

	describe('Errors.get() return validation', () => {
		it('should build error object', () => {
			Errors.isStackEnabled = true;
			const error = Errors.internalError();
			const errorObj = error.get();
			errorObj.should.have.property('code');
			errorObj.should.have.property('message');
			errorObj.should.have.property('stack');
		});
		it('should build neasted error with no object cause', () => {
			const cause = 'notAnObject';
			const error = Errors.internalError({ cause });
			const errorObj = error.get();
			errorObj.should.have.property('code');
			errorObj.should.have.property('tag');
			errorObj.should.have.property('message');
			errorObj.should.have.property('cause').equal(cause);
		});
		it('should build neasted error object', () => {
			Errors.isStackEnabled = true;
			const error = Errors.internalError({ cause: Errors.internalError({ cause: new RangeError('Some bug') }) });
			const errorObj = error.get();
			errorObj.should.have.property('code');
			errorObj.should.have.property('message');
			errorObj.should.have.property('stack');
			errorObj.should.have.property('cause');
			errorObj.cause.should.have.property('code');
			errorObj.cause.should.have.property('message');
			errorObj.cause.should.have.property('stack');
			errorObj.cause.should.have.property('cause');
			errorObj.cause.cause.should.not.have.property('code');
			errorObj.cause.cause.should.have.property('message');
			errorObj.cause.cause.should.have.property('stack');
		});
		it('should build neasted error object in production env', () => {
			Errors.isStackEnabled = false;
			const error = Errors.internalError({ cause: Errors.internalError({ cause: new Error('Some bug') }) });
			const errorObj = error.get();
			errorObj.should.have.property('code');
			errorObj.should.have.property('message');
			errorObj.should.not.have.property('stack');
			errorObj.should.have.property('cause');
			errorObj.cause.should.have.property('code');
			errorObj.cause.should.have.property('message');
			errorObj.cause.should.not.have.property('stack');
			errorObj.cause.should.have.property('cause');
			errorObj.cause.cause.should.not.have.property('code');
			errorObj.cause.cause.should.have.property('message');
			errorObj.cause.cause.should.not.have.property('stack');
		});
	});

	describe('Errors.parse()', () => {
		it('Invalid error should return self object', () => {
			// Errors.isStackEnabled = true;
			[ undefined, 12, [ ], { a: 12, stack: true }, { message: 'bonjour', age: 14 } ].forEach((invalidError) => {
				should(Errors.parse(invalidError)).equal(invalidError);
			});
		});
		it('valid error should return Error object', () => {
			const error = { message: 'bonjour' };
			should(Errors.parse(error)).instanceof(Error);
		});
		it('valid error should return Error object with stack', () => {
			const error = { message: 'bonjour', stack: 'test' };
			should(Errors.parse(error)).instanceof(Error).property('stack').equal(error.stack);
		});
		it('valid error should return Errors object', () => {
			const error = { message: 'bonjour', code: '45', tag: 'BONJOUR' };
			should(Errors.parse(error)).instanceof(Errors);
		});
		it('valid error should return Errors object with neasted cause', () => {
			const cause2 = { message: 'Mami', code: '87', tag: 'MAMI' };
			const cause1 = { message: 'coucou', code: '17', tag: 'COUCOU', cause: cause2 };
			const error = { message: 'bonjour', code: '45', tag: 'BONJOUR', cause: cause1 };
			const built = Errors.parse(error);
			should(built).instanceof(Errors).property('cause').instanceof(Errors).property('cause').instanceof(Errors);
		});
	});
});
