import Validator from './Validator';

import { Errors } from './Factory';
Errors.Validator = Validator;

export { Errors, Eratum } from './Factory';

/**
 * @memberof Errors
 * @function internalError
 * @property {String} TAG INTERNAL_ERROR
 */
Errors.register('internalError', '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function unexpectedError
 * @property {String} TAG UNEXPECTED_ERROR
 */
Errors.register('unexpectedError', '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function programingFault
 * @property {String} TAG PROGRAMING_FAULT
 */
Errors.register('programingFault', '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function notYetImplemented
 * @property {String} TAG NOT_YET_IMPLEMENTED
 */
Errors.register('notYetImplemented', 'Feature(<%- name %>) is not yet implemented.<% if (locals.reason) { %><%- reason %><% } %>', ['name']);

/**
 * @memberof Errors
 * @function initialized
 * @property {String} TAG INITIALIZED
 */
Errors.register('initialized', 'Resource(<%- name %>) is already initialized.', ['name']);
/**
 * @memberof Errors
 * @function notInitialized
 * @property {String} TAG NOT_INITIALIZED
 */
Errors.register('notInitialized', 'Resource(<%- name %>) is not initialized.', ['name']);

/**
 * @memberof Errors
 * @function invalid
 * @property {String} TAG INVALID
 */
Errors.register('invalid', 'Resource(<%- name %>) is invalid.<% if (locals.reason) { %><%- reason %><% } %>', ['name']);
/**
 * @memberof Errors
 * @function invalidType
 * @property {String} TAG INVALID_TYPE
 */
Errors.register('invalidType', 'Resource(<%- name %>) as invalid type(<%- actualType %>) instead of (<%- expectedType %>).', ['name', 'actualType', 'expectedType']);

/**
 * @memberof Errors
 * @function exist
 * @property {String} TAG EXIST
 */
Errors.register('exist', 'Resource(<%- name %>) exist.', ['name']);
/**
 * @memberof Errors
 * @function doesntExist
 * @property {String} TAG DOESNT_EXIST
 */
Errors.register('doesntExist', 'Resource(<%- name %>) doesn\'t exist.', ['name']);

/**
 * @memberof Errors
 * @function equal
 * @property {String} TAG EQUAL
 */
Errors.register('equal', '<%- name %>(<%- value %>) is forbidden', ['name', 'value']);
/**
 * @memberof Errors
 * @function notEqual
 * @property {String} TAG NOT_EQUAL
 */
Errors.register('notEqual', '<%- name %>(<%- actualValue %>) is not equal to <%- expectedValue %>', ['name', 'actualValue', 'expectedValue']);

/**
 * @memberof Errors
 * @function greaterThan
 * @property {String} TAG GREATER_THAN
 */
Errors.register('greaterThan', '<%- name %>(<%- value %>) is greater than <%- limit %>', ['name', 'value', 'limit']);
/**
 * @memberof Errors
 * @function notGreaterThan
 * @property {String} TAG NOT_GREATER_THAN
 */
Errors.register('notGreaterThan', '<%- name %>(<%- value %>) is not greater than <%- limit %>', ['name', 'value', 'limit']);
/**
 * @memberof Errors
 * @function lowerThan
 * @property {String} TAG LOWER_THAN
 */
Errors.register('lowerThan', '<%- name %>(<%- value %>) is lower than <%- limit %>', ['name', 'value', 'limit']);
/**
 * @memberof Errors
 * @function notLowerThan
 * @property {String} TAG NOT_LOWER_THAN
 */
Errors.register('notLowerThan', '<%- name %>(<%- value %>) is not lower than <%- limit %>', ['name', 'value', 'limit']);

/**
 * @memberof Errors
 * @function included
 * @property {String} TAG INCLUDED
 */
Errors.register('included', '<%- name %>(<%- value %>) is included in <%- forbiddenValues %>', ['name', 'value', 'forbiddenValues']);
/**
 * @memberof Errors
 * @function notIncluded
 * @property {String} TAG NOT_INCLUDED
 */
Errors.register('notIncluded', '<%- name %>(<%- value %>) is not included in <%- possibleValues %>', ['name', 'value', 'possibleValues']);
/**
 * @memberof Errors
 * @function invalidFormat
 * @property {String} TAG INVALID_FORMAT
 */
Errors.register('invalidFormat', '<%- name %>(<%- value %>) format is not valid(<%- format %>)', ['name', 'value', 'format']);
