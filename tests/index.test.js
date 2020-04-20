require('mocha');
const { expect } = require('chai');
const { randomString, SYMOBOLS } = require('@plokkke/toolbox');

const { default: Errors, registerError } = require('../sources/index');

function identifier() {
	return randomString(16, SYMOBOLS.ALPHA_LOWER);
}

describe('Javascript Errors unit tests', () => {
	describe('Registered error controls', () => {
		it('registerError() should throw doesntExist error', () => {
			const errorName = 'doesntExist';

			try {
				registerError();
				expect.fail();
			} catch (error) {
				expect(error).instanceOf(Errors[errorName].class);
				expect(error).property('tag').equal(Errors[errorName].tag);
				expect(error).property('parameters').a('object');
				expect(error.parameters).property('name').equal('name');
			}
		});
		it('registerError(42) should throw invalidType error', () => {
			const errorName = 'invalidType';

			try {
				registerError(42);
				expect.fail();
			} catch (error) {
				expect(error).instanceOf(Errors[errorName].class);
				expect(error).property('tag').equal(Errors[errorName].tag);
				expect(error).property('parameters').a('object');
				expect(error.parameters).property('name').equal('name');
				expect(error.parameters).property('actualType').equal('Number');
				expect(error.parameters).property('expectedType').equal('String');
			}
		});
		it('registerError(\'identifier\', null) should throw doesntExist error', () => {
			const name = identifier();
			const template = null;
			const errorName = 'doesntExist';

			try {
				registerError(name, template);
				expect.fail();
			} catch (error) {
				expect(error, error).instanceOf(Errors[errorName].class);
				expect(error).property('tag').equal(Errors[errorName].tag);
				expect(error).property('parameters').a('object');
				expect(error.parameters).property('name').equal('template');
			}
		});
		it('registerError(\'identifier\', 42) should throw invalidType error', () => {
			const name = identifier();
			const template = 42;
			const errorName = 'invalidType';

			try {
				registerError(name, template);
				expect.fail();
			} catch (error) {
				expect(error, error).instanceOf(Errors[errorName].class);
				expect(error).property('tag').equal(Errors[errorName].tag);
				expect(error).property('parameters').a('object');
				expect(error.parameters).property('name').equal('template');
				expect(error.parameters).property('actualType').equal('Number');
				expect(error.parameters).property('expectedType').equal('String');
			}
		});
		it('registerError(\'identifier\', \'\', null) should throw doesntExist error', () => {
			const name = identifier();
			const template = '';
			const requiredAttrs = null;
			const errorName = 'doesntExist';

			try {
				registerError(name, template, requiredAttrs);
				expect.fail();
			} catch (error) {
				expect(error, error).instanceOf(Errors[errorName].class);
				expect(error).property('tag').equal(Errors[errorName].tag);
				expect(error).property('parameters').a('object');
				expect(error.parameters).property('name').equal('requiredAttrs');
			}
		});
		it('registerError(\'identifier\', \'\', 42) should throw invalidType error', () => {
			const name = identifier();
			const template = '';
			const requiredAttrs = 42;
			const errorName = 'invalidType';

			try {
				registerError(name, template, requiredAttrs);
				expect.fail();
			} catch (error) {
				expect(error, error).instanceOf(Errors[errorName].class);
				expect(error).property('tag').equal(Errors[errorName].tag);
				expect(error).property('parameters').a('object');
				expect(error.parameters).property('name').equal('requiredAttrs');
				expect(error.parameters).property('actualType').equal('Number');
				expect(error.parameters).property('expectedType').equal('Array');
			}
		});
		it('registerError(\'identifier\', \'\', [42]) should throw invalidType error', () => {
			const name = identifier();
			const template = '';
			const attribute = 42;
			const errorName = 'invalid';
			const errorNameNested = 'invalidType';

			try {
				registerError(name, template, [ attribute ]);
				expect.fail();
			} catch (error) {
				expect(error).instanceOf(Errors[errorName].class);
				expect(error).property('tag').equal(Errors[errorName].tag);
				expect(error).property('cause').instanceOf(Errors[errorNameNested].class);
				expect(error.cause).property('tag').equal(Errors[errorNameNested].tag);
				expect(error.cause).property('parameters').a('object');
				expect(error.cause.parameters).property('name').equal('requiredAttrs[0]');
				expect(error.cause.parameters).property('actualType').equal('Number');
				expect(error.cause.parameters).property('expectedType').equal('String');
			}
		});
	});

	describe('Produce error controls', () => {
		it('Errors.exist(null) should throw doesntExist error', () => {
			const errorName = 'doesntExist';

			try {
				Errors.exist(null);
				expect.fail();
			} catch (error) {
				expect(error).instanceOf(Errors[errorName].class);
				expect(error).property('tag').equal(Errors[errorName].tag);
				expect(error).property('parameters').a('object');
				expect(error.parameters).property('name').equal('parameters');
			}
		});
		it('Errors.exist(42) should throw invalidType error', () => {
			const errorName = 'invalidType';

			try {
				Errors.exist(42);
				expect.fail();
			} catch (error) {
				expect(error).instanceOf(Errors[errorName].class);
				expect(error).property('tag').equal(Errors[errorName].tag);
				expect(error).property('parameters').a('object');
				expect(error.parameters).property('name').equal('parameters');
				expect(error.parameters).property('actualType').equal('Number');
				expect(error.parameters).property('expectedType').equal('Object');
			}
		});
	});
});
