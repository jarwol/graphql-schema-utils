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
 * GraphQL non-null type.
 * @external GraphQLNonNull
 * @see {@link https://github.com/graphql/graphql-js/blob/master/src/type/definition.js}
 */

/**
 * GraphQL list type.
 * @external GraphQLList
 * @see {@link https://github.com/graphql/graphql-js/blob/master/src/type/definition.js}
 */

(function () {

    const GraphQLSchema = require('graphql/type/schema').GraphQLSchema,
        GraphQLObjectType = require('graphql/type/definition').GraphQLObjectType,
        GraphQLScalarType = require('graphql/type/definition').GraphQLScalarType,
        GraphQLUnionType = require('graphql/type/definition').GraphQLUnionType,
        GraphQLEnumType = require('graphql/type/definition').GraphQLEnumType,
        GraphQLNonNull = require('graphql/type/definition').GraphQLNonNull,
        GraphQLList = require('graphql/type/definition').GraphQLList,
        GraphQLInterfaceType = require('graphql/type/definition').GraphQLInterfaceType,
        format = require('util').format,
        cloneDeep = require('lodash.clonedeep');

    // Diff extensions
    GraphQLSchema.prototype.diff = diffSchema;
    GraphQLObjectType.prototype.diff = GraphQLInterfaceType.prototype.diff = diffObjectTypes;
    GraphQLEnumType.prototype.diff = diffEnumTypes;
    GraphQLScalarType.prototype.diff = diffScalarTypes;
    GraphQLUnionType.prototype.diff = diffUnionTypes;

    // Merge extensions
    GraphQLSchema.prototype.merge = mergeSchema;
    GraphQLObjectType.prototype.merge = GraphQLInterfaceType.prototype.merge = mergeObjectTypes;
    GraphQLList.prototype.merge = GraphQLNonNull.prototype.merge = GraphQLScalarType.prototype.merge = GraphQLEnumType.prototype.merge = overwriteType;

    /*****************************************************
     * DIFF
     *****************************************************/

    /**
     * Reports differences between this GraphQLSchema and another one by diffing all of the types.
     * @param {GraphQLSchema} other another GraphQLSchema
     * @returns {String[]} list of descriptions of the differences between the schemas
     * @function external:GraphQLSchema#diff
     */
    function diffSchema(other) {
        var diffs = [];
        if (!other || !(other instanceof GraphQLSchema)) {
            throw new TypeError('Cannot diff with null/undefined or non-GraphQLSchema object.');
        }

        for (var key in this.getTypeMap()) {
            const thisType = this.getTypeMap()[key];
            const otherType = other.getTypeMap()[key];
            diffs = diffs.concat(thisType.diff(otherType));
        }
        for (var key in other.getTypeMap()) {
            const thisType = this.getTypeMap()[key];
            if (!thisType) {
                diffs.push('Type missing from this schema: ' + key);
            }
        }
        return diffs;
    }

    /**
     * Reports differences between this GraphQLScalarType and another.
     * @param {GraphQLScalarType} other another GraphQLScalarType
     * @returns {String[]} list of descriptions of the differences between the GraphQLScalarTypes
     * @function external:GraphQLScalarType#diff
     */
    function diffScalarTypes(other) {
        if (!other) {
            return ['Type missing from other schema: ' + this.name];
        }
        if (!(other instanceof GraphQLScalarType)) {
            return [format('Type mismatch: `%s: GraphQLScalarType vs. %s: %s`', this.name, other.name, other.constructor.name)];
        }
        if (this.name !== other.name) {
            return ['Type name difference: ' + this.name + ' | ' + other.name];
        }
        if (this.description != other.description) {
            diffs.push(format('Description diff on type %s: `"%s" vs. "%s"`', this.name, this.description, other.description));
        }
        return [];
    }

    /**
     * Reports differences between this GraphQLEnumType and another. The name and enum values are compared.
     * @param {GraphQLEnumType} other another GraphQLEnumType
     * @returns {String[]} list of descriptions of the differences
     * @function external:GraphQLEnumType#diff
     */
    function diffEnumTypes(other) {
        var diffs = [];
        if (!other) {
            return ['Type missing from other schema: ' + this.name];
        }
        if (this.constructor.name !== other.constructor.name) {
            return [format('Type mismatch: `%s: %s vs. %s: %s`', this.name, this.constructor.name, other.name, other.constructor.name)];
        }
        if (this.name !== other.name) {
            return ['Type name difference: ' + this.name + ' | ' + other.name];
        }
        if (this.description != other.description) {
            diffs.push(format('Description diff on type %s: `"%s" vs. "%s"`', this.name, this.description, other.description));
        }
        for (var i = 0; i < this.getValues().length; i++) {
            if (!enumEquals(this.getValues()[i], other.getValues()[i])) {
                diffs.push('Enum values differ in type ' + this.name);
            }
        }
        return diffs;
    }

    /**
     * Reports differences between this GraphQLUnionType and another GraphQLUnionType.
     * @param {GraphQLUnionType} other another GraphQLUnionType
     * @returns {String[]} list of descriptions of the differences
     * @function external:GraphQLUnionType#diff
     */
    function diffUnionTypes(other) {
        if (!other) {
            return ['Type missing from other schema: ' + this.name];
        }
        if (this.constructor.name !== other.constructor.name) {
            return [format('Type mismatch: `%s: %s vs. %s: %s`', this.name, this.constructor.name, other.name, other.constructor.name)];
        }
        if (this.name !== other.name) {
            return ['Type name difference: ' + this.name + ' vs. ' + other.name];
        }
        if (this.description != other.description) {
            diffs.push(format('Description diff on type %s: `"%s" vs. "%s"`', this.name, this.description, other.description));
        }
        const thisType = this.getTypes().map(function (type) {
            return type.name;
        }).sort().join(' | ');
        const otherType = other.getTypes().map(function (type) {
            return type.name;
        }).sort().join(' | ');

        if (thisType !== otherType) {
            return [format('Difference in union type %s: `%s vs. %s`', this.name, thisType, otherType)];
        }
        return [];
    }

    /**
     * Reports differences between this GraphQLObjectType or GraphQLInterfaceType and another. Fields and implemented interfaces are compared.
     * @param {GraphQLObjectType|GraphQLInterfaceType} other another GraphQLObjectType or GraphQLInterfaceType
     * @returns {String[]} list of descriptions of the differences
     * @function external:GraphQLObjectType#diff
     */
    function diffObjectTypes(other) {
        var diffs = [];
        if (!other) {
            return ['Type missing from other schema: ' + this.name];
        }
        if (this.constructor.name !== other.constructor.name) {
            return [format('Type mismatch: `%s: %s vs. %s: %s`', this.name, this.constructor.name, other.name, other.constructor.name)];
        }
        if (this.name !== other.name) {
            diffs.push('Type name difference: ' + this.name + ' vs. ' + other.name);
        }
        if (this.description != other.description) {
            diffs.push(format('Description diff on type %s: `"%s" vs. "%s"`', this.name, this.description, other.description));
        }
        diffs = diffs.concat(diffFields(this, other));
        if (this instanceof GraphQLObjectType) {
            diffs = diffs.concat(diffInterfaces(this, other)).concat(diffInterfaces(other, this));
        }
        return diffs;
    }

    function diffFields(thisType, otherType) {
        var diffs = [];
        for (var key in thisType.getFields()) {
            if (thisType.getFields().hasOwnProperty(key)) {
                const thisField = thisType.getFields()[key];
                const otherField = otherType.getFields()[key];
                if (!otherField) {
                    diffs.push(format('Field missing from other: `%s.%s`', thisType.name, getFieldString(thisField)));
                    continue;
                }
                const thisFieldString = getFieldString(thisField);
                const otherFieldString = getFieldString(otherField);
                if (thisFieldString !== otherFieldString) {
                    diffs.push(format('Field diff on type %s: `%s vs. %s`', thisType.name, thisFieldString, otherFieldString));
                }
                if (thisField.description != otherField.description) {
                    diffs.push(format('Description diff on field %s.%s: `"%s" vs. "%s"`', thisType.name, key, thisField.description, otherField.description));
                }
                diffs = diffs.concat(diffArgDescriptions(thisType.name, thisField, otherField));
            }
        }
        for (var key in otherType.getFields()) {
            if (otherType.getFields().hasOwnProperty(key)) {
                const thisField = thisType.getFields()[key];
                const otherField = otherType.getFields()[key];
                if (!thisField) {
                    diffs.push(format('Field missing from this: `%s.%s`', thisType.name, getFieldString(otherField)));
                }
            }
        }
        return diffs;
    }

    function diffArgDescriptions(typeName, thisField, otherField) {
        const thisArgs = new Map(thisField.args.map(function (arg) {
            return [arg.name, arg];
        }));
        return otherField.args.map(function (arg) {
            if (thisArgs.has(arg.name)) {
                const thisDescription = thisArgs.get(arg.name).description;
                const otherDescription = arg.description;
                if (thisDescription !== otherDescription) {
                    return format('Description diff on argument %s.%s(%s): `"%s" vs. "%s"`', typeName, thisField.name, arg.name, thisDescription, otherDescription);
                }
            }
            return null;
        }).filter(function (str) {
            return !!str;
        });
    }

    function diffInterfaces(thisType, otherType) {
        var match = true;
        for (var i = 0; i < thisType.getInterfaces().length; i++) {
            match = otherType.getInterfaces().some(function (item) {
                    return item.name === thisType.getInterfaces()[i].name;
                }
            );
            if (!match) {
                break;
            }
        }

        if (!match) {
            return [format('Interface diff on type %s: `%s vs. %s`', thisType.name, thisType.getInterfaces().join(', '), otherType.getInterfaces().join(', '))];
        }
        return [];
    }

    function enumEquals(val1, val2) {
        return val1.value === val2.value && val1.name === val2.name && val1.isDeprecated === val2.isDeprecated
            && val1.description === val2.description && val1.deprecationReason === val2.deprecationReason;
    }

    function getFieldString(field) {
        return field.name + getArgsString(field) + ': ' + field.type.toString();
    }

    function getArgsString(field) {
        if (!field.args.length) {
            return '';
        }
        return '(' + field.args.map(function (arg) {
                const defaultVal = arg.defaultValue ? ' = ' + arg.defaultValue : '';
                return arg.name + ': ' + arg.type.toString() + defaultVal;
            }).join(', ') + ')';
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
        if (!other || !(other instanceof GraphQLSchema)) {
            throw new TypeError('Cannot merge with null/undefined or non-GraphQLSchema object.');
        }
        const merged = cloneDeep(this);
        for (var key in this.getTypeMap()) {
            const thisType = this.getTypeMap()[key];
            const otherType = other.getTypeMap()[key];
            merged._typeMap[key] = thisType.merge(otherType);
        }
        for (var key in other.getTypeMap()) {
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
     * @param {GraphQLList|GraphQLNonNull|GraphQLScalarType|GraphQLEnumType} other another GraphQL type object to merge with this
     * @returns {GraphQLList|GraphQLNonNull|GraphQLScalarType|GraphQLEnumType} other if it exists, otherwise this.
     * @function external:GraphQLScalarType#merge
     */
    function overwriteType(other) {
        return other || this;
    }

    /**
     * Merges another GraphQLObjectType or GraphQLInterfaceType with this one by taking the union of all fields in both types, overwriting this type's
     * fields with the other's if there are conflicts. For GraphQLObjectTypes, implemented interfaces are also merged.
     * @param other another GraphQL type to merge with this one
     * @returns {GraphQLObjectType|GraphQLInterfaceType} a new GraphQLObjectType resulting from merging `this` and `other`
     * @function external:GraphQLObjectType#merge
     */
    function mergeObjectTypes(other) {
        const mergedType = cloneDeep(this);
        if (!other) {
            return mergedType;
        }
        if (this.constructor.name !== other.constructor.name) {
            throw new TypeError(format('Cannot merge with different base type. this: %s, other: %s.', this.constructor.name, other.constructor.name));
        }
        const otherFields = Object.keys(other.getFields());
        for (var i = 0; i < otherFields.length; i++) {
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

})();
