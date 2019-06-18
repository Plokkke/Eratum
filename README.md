# Modules Errors

## Usage

### Simple case

```javascript
const Errors = require('eratum');

throw Errors.notYetImplemented({ name: 'awesomeFeature', reason: 'Planned in v2.3' });
// or
Promise.reject(Errors.notYetImplemented({ name: 'awesomeFeature', reason: 'Planned in v2.3' }));
```

### Nested case

```javascript
const Errors = require('eratum');

try {
	try {
		if (key.length !== KEY_LENGTH) {
			throw Errors.notEqual({ name: 'key', actualValue: key.length, expectedValue: KEY_LENGTH });
		}
	} catch (cause) {
		throw Errors.unexpectedError({ reason: 'Cipher fail', origin: 'CRYPTO', cause})
	}
} catch (cause) {
	throw Errors.internalError({ reason: 'Authentication fail', origin: 'LOGIN', cause})
}
// And so on ...
```

## Extends

```javascript
const Errors = require('eratum');

Errors.registerError('OUT_OF_BOUND', 1000, 'Resource(<%= name %>) is out of bound(<%= bound %>)', [ 'name', 'bound' ] );

try {
	throw Errors.outOfBound({ name: 14, bound: 10 });
} catch (error) {
	if (error.code === Errors.OUT_OF_BOUND) {
		//TODO
	}
}
```

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

-   [Errors](#errors)
    -   [Parameters](#parameters)
    -   [get](#get)
    -   [Errors.get](#errorsget)
        -   [Parameters](#parameters-1)
    -   [Errors.parse](#errorsparse)
        -   [Parameters](#parameters-2)
    -   [Errors.register](#errorsregister)
        -   [Parameters](#parameters-3)
    -   [Errors.build](#errorsbuild)
        -   [Parameters](#parameters-4)
    -   [isStackEnabled](#isstackenabled)
    -   [internalError](#internalerror)
        -   [Properties](#properties)
    -   [unexpectedError](#unexpectederror)
        -   [Properties](#properties-1)
    -   [programingFault](#programingfault)
        -   [Properties](#properties-2)
    -   [notYetImplemented](#notyetimplemented)
        -   [Properties](#properties-3)
    -   [initialized](#initialized)
        -   [Properties](#properties-4)
    -   [notInitialized](#notinitialized)
        -   [Properties](#properties-5)
    -   [invalid](#invalid)
        -   [Properties](#properties-6)
    -   [invalidType](#invalidtype)
        -   [Properties](#properties-7)
    -   [exist](#exist)
        -   [Properties](#properties-8)
    -   [doesntExist](#doesntexist)
        -   [Properties](#properties-9)
    -   [equal](#equal)
        -   [Properties](#properties-10)
    -   [notEqual](#notequal)
        -   [Properties](#properties-11)
    -   [greaterThan](#greaterthan)
        -   [Properties](#properties-12)
    -   [notGreaterThan](#notgreaterthan)
        -   [Properties](#properties-13)
    -   [lowerThan](#lowerthan)
        -   [Properties](#properties-14)
    -   [notLowerThan](#notlowerthan)
        -   [Properties](#properties-15)
    -   [included](#included)
        -   [Properties](#properties-16)
    -   [notIncluded](#notincluded)
        -   [Properties](#properties-17)
    -   [invalidFormat](#invalidformat)
        -   [Properties](#properties-18)

### Errors

**Extends Error**

#### Parameters

-   `message`  
-   `code` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** Unique numeric identifier for this error type.
-   `tag` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Unique string identifier for this error type. Must be capitalized snake case (/^[A-Z_]\*$/).
-   `$3` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$3.cause`   (optional, default `null`)
    -   `$3.origin`   (optional, default `null`)
    -   `$3.parameters` **...any** 
-   `template` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** EJS template to build error message.
-   `parameters` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** EJS parameters for template rendering.
-   `cause` **([Errors](#errors) \| [Error](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error) | any)** Previous Error generating this one.

#### get

Build an simplified object with code, tag, message, cause(if exists) and stack trace(if enable)

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Raw object

#### Errors.get

Build a simplified object as instance.get(), handle native Error, return parameter if not an Error.

##### Parameters

-   `error` **([Errors](#errors) \| [Error](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error) | any)** Native Error, Enhanced Error, or any.

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Simplified object

#### Errors.parse

Build Errors or Error from plain object returned by get.<br/>
Use for serialize / unserialize.<br/>
Return parameter if parse fail.<br/>

##### Parameters

-   `object` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object to parse.

Returns **([Errors](#errors) \| [Error](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error) | any)** Rebuilt error

#### Errors.register

Register tag as key in Factory, with code as value.<br/>
Register code as key in Factory.tags, with tag as value.<br/>
Register function tag in camel case in this for error generation.<br/>

##### Parameters

-   `tag` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Unique string identifier for this error type. Must be snake case (/^[A-Z_]\*$/).
-   `code` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** Unique numeric identifier for this error type.
-   `template` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** EJS template to build error message. (optional, default `''`)
-   `requiredAttrs` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** Required attributes for previous EJS template. Rendering fail if those attributes are undefined. (optional, default `[]`)

Returns **[undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined)** 

#### Errors.build

Built an error by Tag or code

##### Parameters

-   `identifier` **([String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number))** [description]
-   `parameters` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** [description]

Returns **[Errors](#errors)** [description]

#### isStackEnabled

Define if stack trace is included in get.</br>
Default value is true if NODE_ENV is development, false otherwise.</br>
Could be change at any time durring runtime.

Type: [Boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### internalError

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 1
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** INTERNAL_ERROR

#### unexpectedError

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 2
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** UNEXPECTED_ERROR

#### programingFault

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 3
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** PROGRAMING_FAULT

#### notYetImplemented

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 4
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** NOT_YET_IMPLEMENTED

#### initialized

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 100
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** INITIALIZED

#### notInitialized

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 101
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** NOT_INITIALIZED

#### invalid

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 110
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** INVALID

#### invalidType

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 111
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** INVALID_TYPE

#### exist

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 112
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** EXIST

#### doesntExist

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 113
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** DOESNT_EXIST

#### equal

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 114
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** EQUAL

#### notEqual

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 115
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** NOT_EQUAL

#### greaterThan

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 116
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** GREATER_THAN

#### notGreaterThan

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 117
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** NOT_GREATER_THAN

#### lowerThan

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 118
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** LOWER_THAN

#### notLowerThan

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 119
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** NOT_LOWER_THAN

#### included

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 120
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** INCLUDED

#### notIncluded

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 121
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** NOT_INCLUDED

#### invalidFormat

##### Properties

-   `CODE` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 122
-   `TAG` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** INVALID_FORMAT
