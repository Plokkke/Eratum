
const Errors = require('./Errors.js');

/**
 * @memberof Errors
 * @function internalError
 * @property {Number} CODE 1
 * @property {String} TAG INTERNAL_ERROR
 */
Errors.register('INTERNAL_ERROR', 1, '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function unexpectedError
 * @property {Number} CODE 2
 * @property {String} TAG UNEXPECTED_ERROR
 */
Errors.register('UNEXPECTED_ERROR', 2, '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function programingFault
 * @property {Number} CODE 3
 * @property {String} TAG PROGRAMING_FAULT
 */
Errors.register('PROGRAMING_FAULT', 3, '<% if (locals.reason) { %><%- reason %><% } %>');
/**
 * @memberof Errors
 * @function notYetImplemented
 * @property {Number} CODE 4
 * @property {String} TAG NOT_YET_IMPLEMENTED
 */
Errors.register('NOT_YET_IMPLEMENTED', 4, 'Feature(<%- name %>) is not yet implemented.<% if (locals.reason) { %><%- reason %><% } %>', [ 'name' ]);


/**
 * @memberof Errors
 * @function initialized
 * @property {Number} CODE 100
 * @property {String} TAG INITIALIZED
 */
Errors.register('INITIALIZED', 100, 'Resource(<%- name %>) is already initialized.', [ 'name' ]);
/**
 * @memberof Errors
 * @function notInitialized
 * @property {Number} CODE 101
 * @property {String} TAG NOT_INITIALIZED
 */
Errors.register('NOT_INITIALIZED', 101, 'Resource(<%- name %>) is not initialized.', [ 'name' ]);

/**
 * @memberof Errors
 * @function invalid
 * @property {Number} CODE 110
 * @property {String} TAG INVALID
 */
Errors.register('INVALID', 110, '<%- name %> is invalid.<% if (locals.reason) { %><%- reason %><% } %>', [ 'name' ]);
/**
 * @memberof Errors
 * @function invalidType
 * @property {Number} CODE 111
 * @property {String} TAG INVALID_TYPE
 */
Errors.register('INVALID_TYPE', 111, '<%- name %> as invalid type(<%- actualType %>) instead of (<%- expectedType %>).', [ 'name', 'actualType', 'expectedType' ]);

/**
 * @memberof Errors
 * @function exist
 * @property {Number} CODE 112
 * @property {String} TAG EXIST
 */
Errors.register('EXIST', 112, 'Resource(<%- name %>) exist.', [ 'name' ]);
/**
 * @memberof Errors
 * @function doesntExist
 * @property {Number} CODE 113
 * @property {String} TAG DOESNT_EXIST
 */
Errors.register('DOESNT_EXIST', 113, 'Resource(<%- name %>) doesn\'t exist.', [ 'name' ]);

/**
 * @memberof Errors
 * @function equal
 * @property {Number} CODE 114
 * @property {String} TAG EQUAL
 */
Errors.register('EQUAL', 114, '<%- name %>(<%- value %>) is forbidden', [ 'name', 'value' ]);
/**
 * @memberof Errors
 * @function notEqual
 * @property {Number} CODE 115
 * @property {String} TAG NOT_EQUAL
 */
Errors.register('NOT_EQUAL', 115, '<%- name %>(<%- actualValue %>) is not equal to <%- expectedValue %>', [ 'name', 'actualValue', 'expectedValue' ]);

/**
 * @memberof Errors
 * @function greaterThan
 * @property {Number} CODE 116
 * @property {String} TAG GREATER_THAN
 */
Errors.register('GREATER_THAN', 116, '<%- name %>(<%- value %>) is greater than <%- limit %>', [ 'name', 'value', 'limit' ]);
/**
 * @memberof Errors
 * @function notGreaterThan
 * @property {Number} CODE 117
 * @property {String} TAG NOT_GREATER_THAN
 */
Errors.register('NOT_GREATER_THAN', 117, '<%- name %>(<%- value %>) is not greater than <%- limit %>', [ 'name', 'value', 'limit' ]);
/**
 * @memberof Errors
 * @function lowerThan
 * @property {Number} CODE 118
 * @property {String} TAG LOWER_THAN
 */
Errors.register('LOWER_THAN', 118, '<%- name %>(<%- value %>) is lower than <%- limit %>', [ 'name', 'value', 'limit' ]);
/**
 * @memberof Errors
 * @function notLowerThan
 * @property {Number} CODE 119
 * @property {String} TAG NOT_LOWER_THAN
 */
Errors.register('NOT_LOWER_THAN', 119, '<%- name %>(<%- value %>) is not lower than <%- limit %>', [ 'name', 'value', 'limit' ]);

/**
 * @memberof Errors
 * @function included
 * @property {Number} CODE 120
 * @property {String} TAG INCLUDED
 */
Errors.register('INCLUDED', 120, '<%- name %>(<%- value %>) is included in <%- forbiddenValues %>', [ 'name', 'value', 'forbiddenValues' ]);
/**
 * @memberof Errors
 * @function notIncluded
 * @property {Number} CODE 121
 * @property {String} TAG NOT_INCLUDED
 */
Errors.register('NOT_INCLUDED', 121, '<%- name %>(<%- value %>) is not included in <%- possibleValues %>', [ 'name', 'value', 'possibleValues' ]);
/**
 * @memberof Errors
 * @function invalidFormat
 * @property {Number} CODE 122
 * @property {String} TAG INVALID_FORMAT
 */
Errors.register('INVALID_FORMAT', 122, '<%- name %>(<%- value %>) format is not valid(<%- format %>)', [ 'name', 'value', 'format' ]);


module.exports = Errors;
