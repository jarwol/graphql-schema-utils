# graphql-schema-utils
Extensions for graphql-js to support diffing and merging types and schemas.

# Getting Started
**Install it**
```
npm install --save graphql-schema-utils
```

**Require it**
```
# graphql-js prototypes are automatically extended
require('graphql-schema-utils');
```

**Use it**
```
# Operate on GraphQLSchemas
const thisSchema = buildSchema(...);
const otherSchema = buildSchema(...);
const diffs = schema1.diff(schema2);
const mergedSchema = schema1.merge(schema2);
```
```
# Operate on GraphQL types
const thisType = new GraphQLObjectType(...);
const otherType = new GraphQLObjectType(...);
const diffs = thisType.diff(otherType);
const mergedType = thisType.merge(otherType);
```

# API Docs
## Classes

<dl>
<dt><a href="#GraphQLDiff">GraphQLDiff</a></dt>
<dd><p>Object containing metadata about a diff between two GraphQL types.</p>
</dd>
</dl>
<dl>
<dt><a href="#external_GraphQLSchema">GraphQLSchema</a></dt>
<dd><p>GraphQL schema.</p>
</dd>
<dt><a href="#external_GraphQLUnionType">GraphQLUnionType</a></dt>
<dd><p>GraphQL union type.</p>
</dd>
<dt><a href="#external_GraphQLObjectType">GraphQLObjectType</a></dt>
<dd><p>GraphQL object type.</p>
</dd>
<dt><a href="#external_GraphQLInterfaceType">GraphQLInterfaceType</a></dt>
<dd><p>GraphQL interface type.</p>
</dd>
<dt><a href="#external_GraphQLScalarType">GraphQLScalarType</a></dt>
<dd><p>GraphQL scalar type.</p>
</dd>
<dt><a href="#external_GraphQLEnumType">GraphQLEnumType</a></dt>
<dd><p>GraphQL enum type.</p>
</dd>
<dt><a href="#external_GraphQLNonNull">GraphQLNonNull</a></dt>
<dd><p>GraphQL non-null type.</p>
</dd>
<dt><a href="#external_GraphQLList">GraphQLList</a></dt>
<dd><p>GraphQL list type.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#DiffType">DiffType</a> : <code>Object</code></dt>
<dd><p>Constants representing valid types of GraphQLDiffs.</p>
</dd>
</dl>

<a name="external_GraphQLSchema"></a>

## GraphQLSchema
GraphQL schema.

**Kind**: global external
**See**: [https://github.com/graphql/graphql-js/blob/master/src/type/schema.js](https://github.com/graphql/graphql-js/blob/master/src/type/schema.js)

* [GraphQLSchema](#external_GraphQLSchema)
    * [.diff(other)](#external_GraphQLSchema+diff) ⇒ <code>Array.&lt;GraphQLDiff&gt;</code>
    * [.merge(other)](#external_GraphQLSchema+merge) ⇒ <code>GraphQLSchema</code>

<a name="external_GraphQLSchema+diff"></a>

### graphQLSchema.diff(other) ⇒ <code>Array.&lt;GraphQLDiff&gt;</code>
Reports differences between this GraphQLSchema and another one by diffing all of the types.

**Kind**: instance method of <code>[GraphQLSchema](#external_GraphQLSchema)</code>
**Returns**: <code>Array.&lt;GraphQLDiff&gt;</code> - array of differences between the schemas

| Param | Type | Description |
| --- | --- | --- |
| other | <code>GraphQLSchema</code> | another GraphQLSchema |

<a name="external_GraphQLSchema+merge"></a>

### graphQLSchema.merge(other) ⇒ <code>GraphQLSchema</code>
Merge this GraphQLSchema with another one. This schema's types and fields take precedence over other's.
Does not modify either schema, but instead returns a new one.

**Kind**: instance method of <code>[GraphQLSchema](#external_GraphQLSchema)</code>
**Returns**: <code>GraphQLSchema</code> - new GraphQLSchema representing this merged with other

| Param | Type | Description |
| --- | --- | --- |
| other | <code>GraphQLSchema</code> | another GraphQLSchema to merge with this one |

<a name="external_GraphQLUnionType"></a>

## GraphQLUnionType
GraphQL union type.

**Kind**: global external
**See**: [https://github.com/graphql/graphql-js/blob/master/src/type/definition.js](https://github.com/graphql/graphql-js/blob/master/src/type/definition.js)
<a name="external_GraphQLUnionType+diff"></a>

### graphQLUnionType.diff(other) ⇒ <code>Array.&lt;GraphQLDiff&gt;</code>
Reports differences between this GraphQLUnionType and another GraphQLUnionType.

**Kind**: instance method of <code>[GraphQLUnionType](#external_GraphQLUnionType)</code>
**Returns**: <code>Array.&lt;GraphQLDiff&gt;</code> - array of differences

| Param | Type | Description |
| --- | --- | --- |
| other | <code>GraphQLUnionType</code> | another GraphQLUnionType |

<a name="external_GraphQLObjectType"></a>

## GraphQLObjectType
GraphQL object type.

**Kind**: global external
**See**: [https://github.com/graphql/graphql-js/blob/master/src/type/definition.js](https://github.com/graphql/graphql-js/blob/master/src/type/definition.js)

* [GraphQLObjectType](#external_GraphQLObjectType)
    * [.diff(other)](#external_GraphQLObjectType+diff) ⇒ <code>Array.&lt;GraphQLDiff&gt;</code>
    * [.merge(other)](#external_GraphQLObjectType+merge) ⇒ <code>GraphQLObjectType</code> &#124; <code>GraphQLInterfaceType</code>

<a name="external_GraphQLObjectType+diff"></a>

### graphQLObjectType.diff(other) ⇒ <code>Array.&lt;GraphQLDiff&gt;</code>
Reports differences between this GraphQLObjectType or GraphQLInterfaceType and another. Fields and implemented interfaces are compared.

**Kind**: instance method of <code>[GraphQLObjectType](#external_GraphQLObjectType)</code>
**Returns**: <code>Array.&lt;GraphQLDiff&gt;</code> - array of differences

| Param | Type | Description |
| --- | --- | --- |
| other | <code>GraphQLObjectType</code> &#124; <code>GraphQLInterfaceType</code> | another GraphQLObjectType or GraphQLInterfaceType |

<a name="external_GraphQLObjectType+merge"></a>

### graphQLObjectType.merge(other) ⇒ <code>GraphQLObjectType</code> &#124; <code>GraphQLInterfaceType</code>
Merges another GraphQLObjectType or GraphQLInterfaceType with this one by taking the union of all fields in both types, overwriting this type's
fields with the other's if there are conflicts. For GraphQLObjectTypes, implemented interfaces are also merged.

**Kind**: instance method of <code>[GraphQLObjectType](#external_GraphQLObjectType)</code>
**Returns**: <code>GraphQLObjectType</code> &#124; <code>GraphQLInterfaceType</code> - a new GraphQLObjectType resulting from merging `this` and `other`

| Param | Description |
| --- | --- |
| other | another GraphQL type to merge with this one |

<a name="external_GraphQLInterfaceType"></a>

## GraphQLInterfaceType
GraphQL interface type.

**Kind**: global external
**See**: [https://github.com/graphql/graphql-js/blob/master/src/type/definition.js](https://github.com/graphql/graphql-js/blob/master/src/type/definition.js)
<a name="external_GraphQLScalarType"></a>

## GraphQLScalarType
GraphQL scalar type.

**Kind**: global external
**See**: [https://github.com/graphql/graphql-js/blob/master/src/type/definition.js](https://github.com/graphql/graphql-js/blob/master/src/type/definition.js)

* [GraphQLScalarType](#external_GraphQLScalarType)
    * [.diff(other)](#external_GraphQLScalarType+diff) ⇒ <code>Array.&lt;GraphQLDiff&gt;</code>
    * [.merge(other)](#external_GraphQLScalarType+merge) ⇒ <code>GraphQLList</code> &#124; <code>GraphQLNonNull</code> &#124; <code>GraphQLScalarType</code> &#124; <code>GraphQLEnumType</code>

<a name="external_GraphQLScalarType+diff"></a>

### graphQLScalarType.diff(other) ⇒ <code>Array.&lt;GraphQLDiff&gt;</code>
Reports differences between this GraphQLScalarType and another.

**Kind**: instance method of <code>[GraphQLScalarType](#external_GraphQLScalarType)</code>
**Returns**: <code>Array.&lt;GraphQLDiff&gt;</code> - array of differences

| Param | Type | Description |
| --- | --- | --- |
| other | <code>GraphQLScalarType</code> | another GraphQLScalarType |

<a name="external_GraphQLScalarType+merge"></a>

### graphQLScalarType.merge(other) ⇒ <code>GraphQLList</code> &#124; <code>GraphQLNonNull</code> &#124; <code>GraphQLScalarType</code> &#124; <code>GraphQLEnumType</code>
Merges a type by simply overwriting this type with other if it exists.

**Kind**: instance method of <code>[GraphQLScalarType](#external_GraphQLScalarType)</code>
**Returns**: <code>GraphQLList</code> &#124; <code>GraphQLNonNull</code> &#124; <code>GraphQLScalarType</code> &#124; <code>GraphQLEnumType</code> - other if it exists, otherwise this.

| Param | Type | Description |
| --- | --- | --- |
| other | <code>GraphQLList</code> &#124; <code>GraphQLNonNull</code> &#124; <code>GraphQLScalarType</code> &#124; <code>GraphQLEnumType</code> | another GraphQL type object to merge with this |

<a name="external_GraphQLEnumType"></a>

## GraphQLEnumType
GraphQL enum type.

**Kind**: global external
**See**: [https://github.com/graphql/graphql-js/blob/master/src/type/definition.js](https://github.com/graphql/graphql-js/blob/master/src/type/definition.js)
<a name="external_GraphQLEnumType+diff"></a>

### graphQLEnumType.diff(other) ⇒ <code>Array.&lt;GraphQLDiff&gt;</code>
Reports differences between this GraphQLEnumType and another. The name and enum values are compared.

**Kind**: instance method of <code>[GraphQLEnumType](#external_GraphQLEnumType)</code>
**Returns**: <code>Array.&lt;GraphQLDiff&gt;</code> - array of differences

| Param | Type | Description |
| --- | --- | --- |
| other | <code>GraphQLEnumType</code> | another GraphQLEnumType |

<a name="external_GraphQLNonNull"></a>

## GraphQLNonNull
GraphQL non-null type.

**Kind**: global external
**See**: [https://github.com/graphql/graphql-js/blob/master/src/type/definition.js](https://github.com/graphql/graphql-js/blob/master/src/type/definition.js)
<a name="external_GraphQLList"></a>

## GraphQLList
GraphQL list type.

**Kind**: global external
**See**: [https://github.com/graphql/graphql-js/blob/master/src/type/definition.js](https://github.com/graphql/graphql-js/blob/master/src/type/definition.js)
<a name="GraphQLDiff"></a>

## GraphQLDiff
**Kind**: global class
<a name="new_GraphQLDiff_new"></a>

### new GraphQLDiff(thisType, otherType, diffType, description)
Create a new instance of a GraphQLDiff, containing metadata about a difference between two GraphQL types.


| Param | Type | Description |
| --- | --- | --- |
| thisType | <code>GraphQLObjectType</code> &#124; <code>GraphQLScalarType</code> &#124; <code>GraphQLEnumType</code> &#124; <code>GraphQLNonNull</code> &#124; <code>GraphQLList</code> &#124; <code>GraphQLUnionType</code> | the GraphQL type instance on which the `diff` method was executed |
| otherType | <code>GraphQLObjectType</code> &#124; <code>GraphQLScalarType</code> &#124; <code>GraphQLEnumType</code> &#124; <code>GraphQLNonNull</code> &#124; <code>GraphQLList</code> &#124; <code>GraphQLUnionType</code> | the GraphQL type instance which was compared to thisType |
| diffType | <code>string</code> | the specific kind of difference between thisType and otherType |
| description | <code>string</code> |  |

<a name="DiffType"></a>

## DiffType : <code>Object</code>
Constants representing valid types of GraphQLDiffs.

**Kind**: global constant

# Todo
* Add support for GraphQLInputObjectType.
* Add unit tests for diff/merge at the type level. Currently there are only tests for GraphQLSchema.
* Fix JSDoc for function implementations that apply to multiple types (diffObjectTypes() applies to both GraphQLObjectType and GraphQLInterfaceType).
