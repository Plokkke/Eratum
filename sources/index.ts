import Validator from './Validator';

import { init, Errors, registerError, parseError } from './Factory';
init(Validator);

import { Eratum } from './Eratum';

export default Errors;
export { Eratum, registerError, parseError };

/**
 * @memberof Errors
 * @function internalError
 * @property {String} TAG INTERNAL_ERROR
 */
registerError('internalError', '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function unexpectedError
 * @property {String} TAG UNEXPECTED_ERROR
 */
registerError('unexpectedError', '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function programingFault
 * @property {String} TAG PROGRAMING_FAULT
 */
registerError('programingFault', '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function notYetImplemented
 * @property {String} TAG NOT_YET_IMPLEMENTED
 */
registerError('notYetImplemented', 'Feature(<%- name %>) is not yet implemented.<% if (locals.reason) { %><%- reason %><% } %>', ['name']);

/**
 * @memberof Errors
 * @function initialized
 * @property {String} TAG INITIALIZED
 */
registerError('initialized', 'Resource(<%- name %>) is already initialized.', ['name']);
/**
 * @memberof Errors
 * @function notInitialized
 * @property {String} TAG NOT_INITIALIZED
 */
registerError('notInitialized', 'Resource(<%- name %>) is not initialized.', ['name']);

/**
 * @memberof Errors
 * @function invalid
 * @property {String} TAG INVALID
 */
registerError('invalid', 'Resource(<%- name %>) is invalid.<% if (locals.reason) { %><%- reason %><% } %>', ['name']);
/**
 * @memberof Errors
 * @function invalidType
 * @property {String} TAG INVALID_TYPE
 */
registerError('invalidType', 'Resource(<%- name %>) as invalid type(<%- actualType %>) instead of (<%- expectedType %>).', ['name', 'actualType', 'expectedType']);
/**
 * @memberof Errors
 * @function invalidFormat
 * @property {String} TAG INVALID_FORMAT
 */
registerError('invalidFormat', '<%- name %>(<%- value %>) format is not valid(<%- format %>)', ['name', 'value', 'format']);

/**
 * @memberof Errors
 * @function exist
 * @property {String} TAG EXIST
 */
registerError('exist', 'Resource(<%- name %>) exist.', ['name']);
/**
 * @memberof Errors
 * @function doesntExist
 * @property {String} TAG DOESNT_EXIST
 */
registerError('doesntExist', 'Resource(<%- name %>) doesn\'t exist.', ['name']);

/**
 * @memberof Errors
 * @function equal
 * @property {String} TAG EQUAL
 */
registerError('equal', '<%- name %>(<%- value %>) is forbidden', ['name', 'value']);
/**
 * @memberof Errors
 * @function notEqual
 * @property {String} TAG NOT_EQUAL
 */
registerError('notEqual', '<%- name %>(<%- actualValue %>) is not equal to <%- expectedValue %>', ['name', 'actualValue', 'expectedValue']);

/**
 * @memberof Errors
 * @function included
 * @property {String} TAG INCLUDED
 */
registerError('included', '<%- name %>(<%- value %>) is included in <%- forbiddenValues %>', ['name', 'value', 'forbiddenValues']);
/**
 * @memberof Errors
 * @function notIncluded
 * @property {String} TAG NOT_INCLUDED
 */
registerError('notIncluded', '<%- name %>(<%- value %>) is not included in <%- possibleValues %>', ['name', 'value', 'possibleValues']);
