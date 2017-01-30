'use strict';

/**
 * GraphQL schema.
 * @external GraphQLSchema
 * @see {@link https://github.com/graphql/graphql-js/blob/master/src/type/schema.js}
 */

/**
 * GraphQL union type.
 * @external GraphQLUnionType
 * @see {@link https://github.com/graphql/graphql-js/blob/master/src/type/definition.js}
 */

/**
 * GraphQL object type.
 * @external GraphQLObjectType
 * @see {@link https://github.com/graphql/graphql-js/blob/master/src/type/definition.js}
 */

/**
 * GraphQL interface type.
 * @external GraphQLInterfaceType
 * @see {@link https://github.com/graphql/graphql-js/blob/master/src/type/definition.js}
 */

/**
 * GraphQL scalar type.
 * @external GraphQLScalarType
 * @see {@link https://github.com/graphql/graphql-js/blob/master/src/type/definition.js}
 */

/**
 * GraphQL enum type.
 * @external GraphQLEnumType
 * @see {@link https://github.com/graphql/graphql-js/blob/master/src/type/definition.js}
 */

/**
 * GraphQL input object type.
 * @external GraphQLInputObjectType
 * @see {@link https://github.com/graphql/graphql-js/blob/master/src/type/definition.js}
 */

const GraphQLSchema = require('graphql/type/schema').GraphQLSchema,
    GraphQLObjectType = require('graphql/type/definition').GraphQLObjectType,
    GraphQLScalarType = require('graphql/type/definition').GraphQLScalarType,
    GraphQLUnionType = require('graphql/type/definition').GraphQLUnionType,
    GraphQLEnumType = require('graphql/type/definition').GraphQLEnumType,
    GraphQLInputObjectType = require('graphql/type/definition').GraphQLInputObjectType,
    GraphQLNonNull = require('graphql/type/definition').GraphQLNonNull,
    GraphQLList = require('graphql/type/definition').GraphQLList,
    GraphQLInterfaceType = require('graphql/type/definition').GraphQLInterfaceType,
    GraphQLDiff = require('./lib/diff').GraphQLDiff,
    DiffType = require('./lib/diff').DiffType,
    cloneDeep = require('lodash.clonedeep');

let labelForThisSchema = 'this schema',
    labelForOtherSchema = 'other schema',
    labelForThisType = 'this type',
    labelForOtherType = 'other type';

// Diff extensions
GraphQLSchema.prototype.diff = diffSchema;
GraphQLObjectType.prototype.diff = GraphQLInterfaceType.prototype.diff = GraphQLInputObjectType.prototype.diff = diffObjectTypes;
GraphQLEnumType.prototype.diff = diffEnumTypes;
GraphQLScalarType.prototype.diff = diffScalarTypes;
GraphQLUnionType.prototype.diff = diffUnionTypes;

// Merge extensions
GraphQLSchema.prototype.merge = mergeSchema;
GraphQLObjectType.prototype.merge = GraphQLInterfaceType.prototype.merge = GraphQLInputObjectType.prototype.merge = mergeObjectTypes;
GraphQLList.prototype.merge = GraphQLNonNull.prototype.merge = GraphQLScalarType.prototype.merge = GraphQLEnumType.prototype.merge = overwriteType;
GraphQLUnionType.prototype.merge = mergeUnionTypes;

/*****************************************************
 * DIFF
 *****************************************************/

/**
 * Reports differences between this GraphQLSchema and another one by diffing all of the types.
 * @param {GraphQLSchema} other - another GraphQLSchema
 * @param {Object} [options] - optional properties to modify the behavior of the diff operation
 * @param {String} [options.labelForThis="this schema"] - specifies a custom name to refer to the schema on which .diff(...) was called.
 * @param {String} [options.labelForOther="other schema"] - specifies a custom name to refer to the schema against which this schema is being diffed.
 * @returns {GraphQLDiff[]} array of differences between the schemas
 * @function external:GraphQLSchema#diff
 */
function diffSchema(other, options) {
    options = setDefaultDiffOptions.call(this, options);
    let diffs = [];
    if (!other || !(other instanceof GraphQLSchema)) {
        throw new TypeError('Cannot diff with null/undefined or non-GraphQLSchema object.');
    }

    for (let key in this.getTypeMap()) {
        const thisType = this.getTypeMap()[key];
        const otherType = other.getTypeMap()[key];
        diffs = diffs.concat(thisType.diff(otherType, options));
    }
    for (let key in other.getTypeMap()) {
        const thisType = this.getTypeMap()[key];
        if (!thisType) {
            const diff = new GraphQLDiff(thisType, other.getTypeMap()[key], DiffType.TypeMissing, format('Type missing from {0}: `{1}`.', options.labelForThis, key));
            diffs.push(diff);
        }
    }
    return diffs;
}

/**
 * Reports differences between this GraphQLScalarType and another.
 * @param {GraphQLScalarType} other - another GraphQLScalarType
 * @param {Object} [options] - optional properties to modify the behavior of the diff operation
 * @param {String} [options.labelForThis="this type"] - specifies a custom name to refer to the object on which .diff(...) was called.
 * @param {String} [options.labelForOther="other type"] - specifies a custom name to refer to the object against which this object is being diffed.
 * @returns {GraphQLDiff[]} array of differences
 * @function external:GraphQLScalarType#diff
 */
function diffScalarTypes(other, options) {
    options = setDefaultDiffOptions.call(this, options);
    let commonDiffs = commonTypeDiffs.call(this, other, options);
    if (commonDiffs) {
        return commonDiffs;
    }
    if (this.description !== other.description) {
        const description = format('Description diff on type {0}. {1}: `"{2}"` vs. {3}: `"{4}"`.', this.name, options.labelForThis, this.description, options.labelForOther, other.description);
        return [new GraphQLDiff(this, other, DiffType.TypeDescriptionDiff, description)];
    }
    return [];
}

/**
 * Reports differences between this GraphQLEnumType and another. The name and enum values are compared.
 * @param {GraphQLEnumType} other - another GraphQLEnumType
 * @param {Object} [options] - optional properties to modify the behavior of the diff operation
 * @param {String} [options.labelForThis="this type"] - specifies a custom name to refer to the object on which .diff(...) was called.
 * @param {String} [options.labelForOther="other type"] - specifies a custom name to refer to the object against which this object is being diffed.
 * @returns {GraphQLDiff[]} array of differences
 * @function external:GraphQLEnumType#diff
 */
function diffEnumTypes(other, options) {
    options = setDefaultDiffOptions.call(this, options);
    let commonDiffs = commonTypeDiffs.call(this, other, options);
    if (commonDiffs) {
        return commonDiffs;
    }
    let diffs = [];
    for (let i = 0; i < this.getValues().length; i++) {
        diffs = diffs.concat(diffEnumValues(this.getValues()[i], other.getValues()[i], this, other, options));
    }
    if (this.description !== other.description) {
        const description = format('Description diff on type {0}. {1}: `"{2}"` vs. {3}: `"{4}"`.', this.name, options.labelForThis, this.description, options.labelForOther, other.description);
        diffs.push(new GraphQLDiff(this, other, DiffType.TypeDescriptionDiff, description));
    }
    return diffs;
}

/**
 * Reports differences between this GraphQLUnionType and another GraphQLUnionType.
 * @param {GraphQLUnionType} other - another GraphQLUnionType
 * @param {Object} [options] - optional properties to modify the behavior of the diff operation
 * @param {String} [options.labelForThis="this type"] - specifies a custom name to refer to the object on which .diff(...) was called.
 * @param {String} [options.labelForOther="other type"] - specifies a custom name to refer to the object against which this object is being diffed.
 * @returns {GraphQLDiff[]} array of differences
 * @function external:GraphQLUnionType#diff
 */
function diffUnionTypes(other, options) {
    options = setDefaultDiffOptions.call(this, options);
    let commonDiffs = commonTypeDiffs.call(this, other, options);
    if (commonDiffs) {
        return commonDiffs;
    }
    let diffs = [];
    if (this.description !== other.description) {
        const description = format('Description diff on type {0}. {1}: `"{2}"` vs. {3}: `"{4}"`.', this.name, options.labelForThis, this.description, options.labelForOther, other.description);
        diffs.push(new GraphQLDiff(this, other, DiffType.TypeDescriptionDiff, description));
    }
    const thisType = this.getTypes().map(function (type) {
        return type.name;
    }).sort().join(' | ');
    const otherType = other.getTypes().map(function (type) {
        return type.name;
    }).sort().join(' | ');

    if (thisType !== otherType) {
        const description = format('Difference in union type {0}. {1}: `{2}` vs. {3}: `{4}`.', this.name, options.labelForThis, thisType, options.labelForOther, otherType);
        diffs.push(new GraphQLDiff(this, other, DiffType.UnionTypeDiff, description));
    }
    return diffs;
}

/**
 * Reports differences between this GraphQLObjectType, GraphQLInterfaceType, or GraphQLInputObjectType and another. Fields and implemented interfaces are compared.
 * @param {GraphQLObjectType|GraphQLInterfaceType|GraphQLInputObjectType} other - another GraphQLObjectType, GraphQLInterfaceType, or GraphQLInputObjectType
 * @param {Object} [options] - optional properties to modify the behavior of the diff operation
 * @param {String} [options.labelForThis="this type"] - specifies a custom name to refer to the object on which .diff(...) was called.
 * @param {String} [options.labelForOther="other type"] - specifies a custom name to refer to the object against which this object is being diffed.
 * @returns {GraphQLDiff[]} array of differences
 * @function external:GraphQLObjectType#diff
 * @function external:GraphQLInterfaceType#diff
 * @function external:GraphQLInputObjectType#diff
 */
function diffObjectTypes(other, options) {
    options = setDefaultDiffOptions.call(this, options);
    let commonDiffs = commonTypeDiffs.call(this, other, options);
    if (commonDiffs) {
        return commonDiffs;
    }
    let diffs = diffFields(this, other, options);
    if (this.description !== other.description) {
        const description = format('Description diff on type {0}. {1}: `"{2}"` vs. {3}: `"{4}"`.', this.name, options.labelForThis, this.description, options.labelForOther, other.description);
        diffs.push(new GraphQLDiff(this, other, DiffType.TypeDescriptionDiff, description));
    }
    if (this instanceof GraphQLObjectType) {
        diffs = diffs.concat(diffInterfaces(this, other, options)).concat(diffInterfaces(other, this, options));
    }
    return diffs;
}

function diffFields(thisType, otherType, options) {
    let diffs = [];
    for (let key in thisType.getFields()) {
        if (thisType.getFields().hasOwnProperty(key)) {
            const thisField = thisType.getFields()[key];
            const otherField = otherType.getFields()[key];
            if (!otherField) {
                const description = format('Field missing from {0}: `{1}.{2}`.', options.labelForOther, thisType.name, getFieldString(thisField));
                diffs.push(new GraphQLDiff(thisType, otherType, DiffType.FieldMissing, description));
                continue;
            }
            const thisFieldString = getFieldString(thisField);
            const otherFieldString = getFieldString(otherField);
            if (thisFieldString !== otherFieldString) {
                const description = format('Field diff on type {0}. {1}: `{2}` vs. {3}: `{4}`.', thisType.name, options.labelForThis, thisFieldString, options.labelForOther, otherFieldString);
                diffs.push(new GraphQLDiff(thisType, otherType, DiffType.FieldDiff, description));
            }
            if (thisField.description !== otherField.description) {
                const description = format('Description diff on field {0}.{1}. {2}: `"{3}"` vs. {4}: `"{5}"`.', thisType.name, key, options.labelForThis, thisField.description, options.labelForOther, otherField.description)
                diffs.push(new GraphQLDiff(thisType, otherType, DiffType.FieldDescriptionDiff, description));
            }
            diffs = diffs.concat(diffArgDescriptions(thisType, otherType, thisField, otherField, options));
        }
    }
    for (let key in otherType.getFields()) {
        if (otherType.getFields().hasOwnProperty(key)) {
            const thisField = thisType.getFields()[key];
            const otherField = otherType.getFields()[key];
            if (!thisField) {
                const description = format('Field missing from {0}: `{1}.{2}`.', options.labelForThis, thisType.name, getFieldString(otherField));
                diffs.push(new GraphQLDiff(thisType, otherType, DiffType.FieldMissing, description));
            }
        }
    }
    return diffs;
}

function diffArgDescriptions(thisType, otherType, thisField, otherField, options) {
    if (!thisField.args || !otherField.args) {
        return [];
    }
    const thisArgs = new Map(thisField.args.map(function (arg) {
        return [arg.name, arg];
    }));
    return otherField.args.map(function (arg) {
        if (thisArgs.has(arg.name)) {
            const thisDescription = thisArgs.get(arg.name).description;
            const otherDescription = arg.description;
            if (thisDescription !== otherDescription) {
                const description = format('Description diff on argument {0}.{1}({2}). {3}: `"{4}"` vs. {5}: `"{6}"`.', thisType.name, thisField.name, arg.name, options.labelForThis, thisDescription, options.labelForOther, otherDescription);
                const diff = new GraphQLDiff(thisType, otherType, DiffType.ArgDescriptionDiff, description);
                diff.thisField = thisField;
                diff.otherField = otherField;
                return diff;
            }
        }
        return null;
    }).filter(function (str) {
        return !!str;
    });
}

function diffInterfaces(thisType, otherType, options) {
    if (!interfacesEqual(thisType, otherType) || !interfacesEqual(otherType, thisType)) {
        const description = format('Interface diff on type {0}. {1}: `{2}` vs. {3}: `{4}`.', thisType.name, options.labelForThis, thisType.getInterfaces().join(', '), options.labelForOther, otherType.getInterfaces().join(', '));
        return [new GraphQLDiff(thisType, otherType, DiffType.InterfaceDiff, description)];
    }
    return [];
}

function interfacesEqual(thisType, otherType) {
    let match = true;
    for (let i = 0; i < thisType.getInterfaces().length; i++) {
        match = otherType.getInterfaces().some(function (item) {
                return item.name === thisType.getInterfaces()[i].name;
            }
        );
        if (!match) {
            break;
        }
    }
    return match;
}

function diffEnumValues(thisVal, otherVal, thisType, otherType, options) {
    const diffs = [];
    if (thisVal.name !== otherVal.name || thisVal.value !== otherVal.value) {
        const description = format('Enum diff on type {0}. {1}: `{2}={3}` vs. {4}: `{5}={6}`.', thisType.name, options.labelForThis, thisVal.name, thisVal.value, options.labelForOther, otherVal.name, otherVal.value);
        return [new GraphQLDiff(thisType, otherType, DiffType.EnumDiff, description)];
    }
    if (thisVal.description !== otherVal.description) {
        const description = format('Description diff on enum value {0}.{1}. {2}: `"{3}"` vs. {4}: `"{5}"`.', thisType.name, thisVal.name, options.labelForThis, thisVal.description, options.labelForOther, otherVal.description);
        diffs.push(new GraphQLDiff(thisType, otherType, DiffType.EnumDiff, description));
    }
    const deprecationStatus1 = getDeprecationStatus(thisVal);
    const deprecationStatus2 = getDeprecationStatus(otherVal);
    if (deprecationStatus1 !== deprecationStatus2) {
        const description = format('Deprecation diff on enum value {0}.{1}. {2}: `{3}` vs. {4}: `{5}`.', thisType.name, thisVal.name, options.labelForThis, deprecationStatus1, options.labelForOther, deprecationStatus2)
        diffs.push(new GraphQLDiff(thisType, otherType, DiffType.EnumDiff, description));
    }
    return diffs;
}

function getDeprecationStatus(val) {
    if (val.isDeprecated) {
        return 'is deprecated (' + val.deprecationReason + ')';
    }
    return 'is not deprecated';
}

function commonTypeDiffs(other, options) {
    if (!other) {
        return [new GraphQLDiff(this, other, DiffType.TypeMissing, format('Type missing from {0}: `{1}`.', options.labelForOther, this.name))];
    }
    if (this.constructor.name !== other.constructor.name) {
        const description = format('Type mismatch: {0}: `{1}: {2}` vs. {3}: `{4}: {5}`.', options.labelForThis, this.name, this.constructor.name, options.labelForOther, other.name, other.constructor.name);
        return [new GraphQLDiff(this, other, DiffType.BaseTypeDiff, description)];
    }
    if (this.name !== other.name) {
        const description = format('Type name difference. {0}: `{1}` vs. {2}: `{3}`.', options.labelForThis, this.name, options.labelForOther, other.name);
        return [new GraphQLDiff(this, other, DiffType.TypeNameDiff, description)];
    }
    return null;
}

function getFieldString(field) {
    return field.name + getArgsString(field) + ': ' + field.type.toString();
}

function getArgsString(field) {
    if (!field.args || !field.args.length) {
        return '';
    }
    return '(' + field.args.map(function (arg) {
            const defaultVal = arg.defaultValue ? ' = ' + arg.defaultValue : '';
            return arg.name + ': ' + arg.type.toString() + defaultVal;
        }).join(', ') + ')';
}

function setDefaultDiffOptions(options) {
    options = options || {};
    options.labelForThis = options.labelForThis || (this instanceof GraphQLSchema ? labelForThisSchema : labelForThisType);
    options.labelForOther = options.labelForOther || (this instanceof GraphQLSchema ? labelForOtherSchema : labelForOtherType);
    return options;
}

/*****************************************************
 * MERGE
 *****************************************************/

/**
 * Merge this GraphQLSchema with another one. This schema's types and fields take precedence over other's.
 * Does not modify either schema, but instead returns a new one.
 * @param {GraphQLSchema} other another GraphQLSchema to merge with this one
 * @returns {GraphQLSchema} new GraphQLSchema representing this merged with other
 * @function external:GraphQLSchema#merge
 */
function mergeSchema(other) {
    const merged = cloneDeep(this);
    if (!other) {
        return merged;
    }
    if (!(other instanceof GraphQLSchema)) {
        throw new TypeError('Cannot merge with null/undefined or non-GraphQLSchema object.');
    }
    for (let key in this.getTypeMap()) {
        const thisType = this.getTypeMap()[key];
        const otherType = other.getTypeMap()[key];
        merged._typeMap[key] = thisType.merge(otherType);
    }
    for (let key in other.getTypeMap()) {
        const thisType = this.getTypeMap()[key];
        const otherType = other.getTypeMap()[key];
        if (!thisType) {
            merged._typeMap[key] = otherType;
        }
    }
    return merged;
}

/**
 * Merges a type by simply overwriting this type with other if it exists.
 * @param {GraphQLList|GraphQLNonNull|GraphQLScalarType|GraphQLEnumType} other - another GraphQL type object to merge with this
 * @returns {GraphQLList|GraphQLNonNull|GraphQLScalarType|GraphQLEnumType} other if it exists, otherwise this.
 * @function external:GraphQLScalarType#merge
 * @function external:GraphQLNonNull#merge
 * @function external:GraphQLEnumType#merge
 */
function overwriteType(other) {
    return other || this;
}

/**
 * Merges another GraphQLObjectType or GraphQLInterfaceType with this one by taking the union of all fields in both types, overwriting this type's
 * fields with the other's if there are conflicts. For GraphQLObjectTypes, implemented interfaces are also merged.
 * @param other - another GraphQL type to merge with this one
 * @returns {GraphQLObjectType|GraphQLInterfaceType|GraphQLInputObjectType} a new graphql type resulting from merging `this` and `other`
 * @function external:GraphQLObjectType#merge
 * @function external:GraphQLInterfaceType#merge
 * @function external:GraphQLInputObjectType#merge
 */
function mergeObjectTypes(other) {
    const mergedType = cloneDeep(this);
    if (!other) {
        return mergedType;
    }
    if (this.constructor.name !== other.constructor.name) {
        throw new TypeError(format('Cannot merge with different base type. this: {0}, other: {0}.', this.constructor.name, other.constructor.name));
    }
    const otherFields = Object.keys(other.getFields());
    for (let i = 0; i < otherFields.length; i++) {
        const key = otherFields[i];
        if (other.getFields().hasOwnProperty(key)) {
            mergedType._fields[key] = other.getFields()[key];
        }
    }

    if (this instanceof GraphQLObjectType) {
        mergedType._interfaces = Array.from(new Set(this.getInterfaces().concat(other.getInterfaces())));
    }
    return mergedType;
}

/**
 * Merges this GraphQLUnionType with another GraphQLUnionType by taking the union of the types included in both.
 * @param other - another GraphQLUnionType to merge with this one
 * @returns {GraphQLUnionType} a new GraphQLUnionType resulting from merging `this` and `other`
 * @function external:GraphQLUnionType#merge
 */
function mergeUnionTypes(other) {
    const mergedType = cloneDeep(this);
    if (!other) {
        return mergedType;
    }
    if (this.constructor.name !== other.constructor.name) {
        throw new TypeError(format('Cannot merge with different base type. this: {0}, other: {0}.', this.constructor.name, other.constructor.name));
    }
    const thisTypes = new Map(this.getTypes().map(type => [type.name, true]));
    mergedType._types = mergedType._types.concat(other.getTypes().filter(type => !thisTypes.get(type.name)));
    return mergedType;
}

function format(str) {
    let args = Array.prototype.slice.call(arguments, 1);
    return str.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
}
