'use strict';

const assert = require('assert'),
    buildSchema = require('graphql').buildSchema,
    GraphQLDiff = require('../lib/diff').GraphQLDiff,
    DiffType = require('../lib/diff').DiffType;

require('../index');

const schema1 =
    'type Query {\n' +
    '	FieldOption(contentId: ID!): FieldOption\n' +
    '}\n' +
    'type Tag {\n' +
    '	type: String!\n' +
    '	value: String!\n' +
    '	displayName: String\n' +
    '}\n' +
    'interface CmsItem {\n' +
    '	contentId: ID!\n' +
    '	type: String!\n' +
    '	tags: [Tag!]\n' +
    '}\n' +
    'type FieldOption implements CmsItem {\n' +
    '	contentId: ID!\n' +
    '	type: String!\n' +
    '	tags: [Tag!]\n' +
    '	displayName: String\n' +
    '	value: String\n' +
    '}';
const schema1DifferentOrder =
    'type Query {\n' +
    '	FieldOption(contentId: ID!): FieldOption\n' +
    '}\n' +
    'interface CmsItem {\n' +
    '	contentId: ID!\n' +
    '	type: String!\n' +
    '	tags: [Tag!]\n' +
    '}\n' +
    'type FieldOption implements CmsItem {\n' +
    '	contentId: ID!\n' +
    '	type: String!\n' +
    '	tags: [Tag!]\n' +
    '	displayName: String\n' +
    '	value: String\n' +
    '}\n' +
    '\n' +
    'type Tag {\n' +
    '	type: String!\n' +
    '	value: String!\n' +
    '	displayName: String\n' +
    '}';

describe('GraphQLSchema', function () {
    describe('#diff()', function () {
        it('reports no diffs for equivalent schemas with types in different order', function (done) {
            const a = buildSchema(schema1);
            const b = buildSchema(schema1DifferentOrder);

            assert.deepEqual(a.diff(b), []);
            done();
        });

        it('reports diff for missing types in both this schema and other schema', function (done) {
            const schema2 =
                'type Query {\n' +
                '    Video(contentId: ID!): Video\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type Video implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String\n' +
                '    value: String\n' +
                '}';
            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert.equal(diffs.length, 4);
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.TypeMissing, 'Type missing from this schema: `Video`.', true)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.TypeMissing, 'Type missing from other schema: `FieldOption`.', false)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldMissing, 'Field missing from other schema: `Query.FieldOption(contentId: ID!): FieldOption`.', false)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldMissing, 'Field missing from this schema: `Query.Video(contentId: ID!): Video`.', true)));
            done();
        });

        it('reports diff for missing fields in both types', function (done) {
            const schema2 =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    value: String\n' +
                '    newValue: String\n' +
                '}';
            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert.equal(diffs.length, 2);
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldMissing, 'Field missing from other schema: `FieldOption.displayName: String`.', true)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldMissing, 'Field missing from this schema: `FieldOption.newValue: String`.', false)));
            done();
        });

        it('uses custom names for "this" and "other" if passed in to options', function (done) {
            const schema2 =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    value: String\n' +
                '    newValue: String\n' +
                '}';
            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b, {labelForThis: 'schema A', labelForOther: 'schema B'});
            assert.equal(diffs.length, 2);
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldMissing, 'Field missing from schema B: `FieldOption.displayName: String`.', false)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldMissing, 'Field missing from schema A: `FieldOption.newValue: String`.', true)));
            done();
        });

        it('reports diff for different interface implementations', function (done) {
            const schema1 =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'interface NewInterface {\n' +
                '    value: String\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String\n' +
                '    value: String\n' +
                '}';

            const schema2 =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'interface NewInterface {\n' +
                '    value: String\n' +
                '}\n' +
                'type FieldOption implements CmsItem, NewInterface {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    value: String\n' +
                '    displayName: String\n' +
                '}';
            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.InterfaceDiff, 'Interface diff on type FieldOption. this schema: `CmsItem, NewInterface` vs. other schema: `CmsItem`.', false)));
            done();
        });

        it('reports diff for different field types', function (done) {
            const schema1 = 'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String\n' +
                '    value: String\n' +
                '}';

            const schema2 =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    value: Boolean!\n' +
                '    displayName: String\n' +
                '}';
            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldDiff, 'Field type changed on field FieldOption.value from : `"String"` to `"Boolean!"`.', false)));
            done();
        });

        it('reports field, type, and argument description diffs', function (done) {
            const schema1 =
                'type Query {\n' +
                '    # Query for FieldOptions\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                '# Arbitrary metadata\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                '# Base type for CMS content\n' +
                'interface CmsItem {\n' +
                '    # Content ID\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String!\n' +
                '    value: [String]\n' +
                '}';

            const schema2 =
                'type Query {\n' +
                '    # FieldOption Query\n' +
                '    FieldOption(\n' +
                '        # The content ID\n' +
                '        contentId: ID!\n' +
                '    ): FieldOption\n' +
                '}\n' +
                '# Arbitrary metadata\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                '# Base CMS type\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String!\n' +
                '    value: [String]\n' +
                '}';
            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert.equal(diffs.length, 4);
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldDescriptionDiff, 'Description diff on field Query.FieldOption. this schema: `"Query for FieldOptions"` vs. other schema: `"FieldOption Query"`.', true)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldDescriptionDiff, 'Description diff on field CmsItem.contentId. this schema: `"Content ID"` vs. other schema: `""`.', true)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.TypeDescriptionDiff, 'Description diff on type CmsItem. this schema: `"Base type for CMS content"` vs. other schema: `"Base CMS type"`.', true)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.ArgDescriptionDiff, 'Description diff on argument Query.FieldOption(contentId). this schema: `""` vs. other schema: `"The content ID"`.', true)));
            done();
        });

        it('reports diff for different field arguments', function (done) {
            const schema1 =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String\n' +
                '    value(places: String): String\n' +
                '    value2(places: String): String\n' +
                '}';

            const schema2 =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName(caps: Boolean): String\n' +
                '    value: String\n' +
                '    value2(places: ID): String\n' +
                '}';
            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert.equal(diffs.length, 3);
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.ArgDiff, 'Argument missing from other schema: `FieldOption.value(places: String)`.', false)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.ArgDiff, 'Argument missing from this schema: `FieldOption.displayName(caps: Boolean)`.', true)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.ArgDiff, 'Argument type diff on field FieldOption.value2. this schema: `places: String` vs. other schema: `places: ID.`', true)));
            done();
        });

        it('reports diffs in enums', function (done) {
            const schema1 =
                'type Query {\n' +
                '    Color(name: String): Color\n' +
                '}\n' +
                'enum Color {\n' +
                '    RED\n' +
                '    BLUE\n' +
                '    GREEN\n' +
                '}\n' +
                'enum Car {\n' +
                '    # from Japan\n' +
                '    HONDA\n' +
                '    BMW\n' +
                '}';

            const schema2 =
                'type Query {\n' +
                '    Color(name: String): Color\n' +
                '}\n' +
                'enum Color {\n' +
                '    RED\n' +
                '    BLUE\n' +
                '    ORANGE\n' +
                '    BLACK\n' +
                '}\n' +
                'enum Car {\n' +
                '    # honda\n' +
                '    HONDA\n' +
                '    BMW\n' +
                '}';
            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.EnumDiff, 'Enum value missing from other schema: `"Color.GREEN"`.', false)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.EnumDiff, 'Enum value missing from this schema: `"Color.ORANGE"`.', true)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.EnumDiff, 'Enum value missing from this schema: `"Color.BLACK"`.', true)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.EnumDiff, 'Description diff on enum value Car.HONDA. this schema: `"from Japan"` vs. other schema: `"honda"`.', true)));
            done();
        });

        it('reports diffs in union types', function (done) {
            const schema1 =
                'type Query {\n' +
                '    Pet(name: String): Pet\n' +
                '}\n' +
                'type Cat {\n' +
                '    name: String\n' +
                '    catNip: String\n' +
                '    scratchingPost: String\n' +
                '}\n' +
                'type Fish {\n' +
                '    name: String\n' +
                '    bowl: String\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'union Pet = Cat | Dog';

            const schema2 =
                'type Query {\n' +
                '    Pet(name: String): Pet\n' +
                '}\n' +
                'type Cat {\n' +
                '    name: String\n' +
                '    catNip: String\n' +
                '    scratchingPost: String\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'type Fish {\n' +
                '    name: String\n' +
                '    bowl: String\n' +
                '}\n' +
                'union Pet = Cat | Dog | Fish';

            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.UnionTypeDiff, 'Difference in union type Pet. this schema: `Cat | Dog` vs. other schema: `Cat | Dog | Fish`.', false)));
            done();
        });

        it('reports diffs in input types', function (done) {
            const schema1 =
                'type Query {\n' +
                '    Dog(details: PetDetails): Dog\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'input PetDetails {\n' +
                '    name: String\n' +
                '    weight: Float\n' +
                '}';

            const schema2 =
                'type Query {\n' +
                '    Dog(details: PetDetails): Dog\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'input PetDetails {\n' +
                '    name: String\n' +
                '    type: String\n' +
                '    weight: Int\n' +
                '}';

            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldMissing, 'Field missing from this schema: `PetDetails.type: String`.', true)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldDiff, 'Field type changed on field PetDetails.weight from : `"Float"` to `"Int"`.', false)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.TypeMissing, 'Type missing from this schema: `Int`.', true)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.TypeMissing, 'Type missing from other schema: `Float`.', false)));
            done();
        });

        it('reports diffs on mutation types', function (done) {
            const schema1 =
                'type Query {\n' +
                '    Dogs: [Dog]\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'type Mutation {\n' +
                '    addDog(name: String): Dog\n' +
                '    giveBone(dog: String, bone: String): Dog\n' +
                '}';

            const schema2 =
                'type Query {\n' +
                '    Dogs: [Dog]\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'type Mutation {\n' +
                '    giveBone(dog: String): Dog\n' +
                '}';

            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.FieldMissing, 'Field missing from other schema: `Mutation.addDog(name: String): Dog`.', false)));
            assert(diffExists(diffs, new GraphQLDiff(a, b, DiffType.ArgDiff, 'Argument missing from other schema: `Mutation.giveBone(bone: String)`.', false)));
            done();
        });

        function diffExists(diffs, expectedDiff) {
            for (let i = 0; i < diffs.length; i++) {
                if (diffs[i].diffType === expectedDiff.diffType && diffs[i].description === expectedDiff.description) {
                    return true;
                }
            }
            return false;
        }
    });

    describe('#merge()', function () {
        it('makes no change if merged with null schema', function (done) {
            const a = buildSchema(schema1);
            const merged = a.merge(null);

            assert.deepEqual(a.diff(merged), []);
            done();
        });

        it('makes no change if two identical schemas are merged', function (done) {
            const a = buildSchema(schema1);
            const b = buildSchema(schema1);
            const merged = a.merge(b);

            assert.deepEqual(a.diff(merged), []);
            done();
        });

        it('adds in types from other schema that don\'t exist in this schema', function (done) {
            const schema2 =
                'type Query {\n' +
                '    Video(contentId: ID!): Video\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type Video implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String\n' +
                '    value: String\n' +
                '}';

            const expectedSchema =
                'type Query {\n' +
                '    Video(contentId: ID!): Video\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String\n' +
                '    value: String\n' +
                '}\n' +
                'type Video implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String\n' +
                '    value: String\n' +
                '}';

            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const expected = buildSchema(expectedSchema);

            const merged = a.merge(b);
            assert.deepEqual(expected.diff(merged), []);
            done();
        });

        it('merges fields from types that exist in both schemas', function (done) {
            const schema2 =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String\n' +
                '    newValue: Int\n' +
                '}\n' +
                'input Params {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '}';

            const expectedSchema =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String\n' +
                '    value: String\n' +
                '    newValue: Int\n' +
                '}\n' +
                'input Params {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '}';

            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const expected = buildSchema(expectedSchema);

            const merged = a.merge(b);
            assert.deepEqual(expected.diff(merged), []);
            done();
        });

        it('overwrites this schema\'s fields with the other schema\'s fields if they both exist', function (done) {
            const schema2 =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String!\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String!\n' +
                '    value: Int\n' +
                '}';

            const expectedSchema =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String!\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'type FieldOption implements CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String!\n' +
                '    value: Int\n' +
                '}';

            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const expected = buildSchema(expectedSchema);

            const merged = a.merge(b);
            assert.deepEqual(expected.diff(merged), []);
            done();
        });

        it('merges interfaces implemented by the same type in different schemas', function (done) {
            const schema2 =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface NewInterface {\n' +
                '    value: Int\n' +
                '}\n' +
                'type FieldOption implements NewInterface {\n' +
                '    displayName: String\n' +
                '    value: Int\n' +
                '}';

            const expectedSchema =
                'type Query {\n' +
                '    FieldOption(contentId: ID!): FieldOption\n' +
                '}\n' +
                'type Tag {\n' +
                '    type: String!\n' +
                '    value: String!\n' +
                '    displayName: String\n' +
                '}\n' +
                'interface CmsItem {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '}\n' +
                'interface NewInterface {\n' +
                '    value: Int\n' +
                '}\n' +
                'type FieldOption implements CmsItem, NewInterface {\n' +
                '    contentId: ID!\n' +
                '    type: String!\n' +
                '    tags: [Tag!]\n' +
                '    displayName: String\n' +
                '    value: Int\n' +
                '}';

            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const expected = buildSchema(expectedSchema);

            const merged = a.merge(b);
            assert.deepEqual(expected.diff(merged), []);
            done();
        });

        it('merges union types by including all types from both', function (done) {
            const schema1 =
                'type Query {\n' +
                '    Pet(name: String): Pet\n' +
                '}\n' +
                'type Cat {\n' +
                '    name: String\n' +
                '    catNip: String\n' +
                '    scratchingPost: String\n' +
                '}\n' +
                'type Fish {\n' +
                '    name: String\n' +
                '    bowl: String\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'union Pet = Cat | Dog';

            const schema2 =
                'type Query {\n' +
                '    Pet(name: String): Pet\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'type Fish {\n' +
                '    name: String\n' +
                '    bowl: String\n' +
                '}\n' +
                'union Pet = Dog | Fish';

            const expectedSchema =
                'type Query {\n' +
                '    Pet(name: String): Pet\n' +
                '}\n' +
                'type Cat {\n' +
                '    name: String\n' +
                '    catNip: String\n' +
                '    scratchingPost: String\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'type Fish {\n' +
                '    name: String\n' +
                '    bowl: String\n' +
                '}\n' +
                'union Pet = Cat | Dog | Fish';

            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const expected = buildSchema(expectedSchema);

            const merged = a.merge(b);
            assert.deepEqual(expected.diff(merged), []);
            done();
        });

        it('merges input object types according to same rules as regular object types', function (done) {
            const schema1 =
                'type Query {\n' +
                '    Dog(details: PetDetails): Dog\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'input PetDetails {\n' +
                '    name: String\n' +
                '    weight: String\n' +
                '    location: String\n' +
                '}\n' +
                'input Params {\n' +
                '    id: ID!\n' +
                '    location: String\n' +
                '}';

            const schema2 =
                'type Query {\n' +
                '    Dog(details: PetDetails): Dog\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'input PetDetails {\n' +
                '    name: String\n' +
                '    type: String\n' +
                '    weight: Int\n' +
                '}';

            const expectedSchema =
                'type Query {\n' +
                '    Dog(details: PetDetails): Dog\n' +
                '}\n' +
                'type Dog {\n' +
                '    name: String\n' +
                '    bone: String\n' +
                '    leash: String\n' +
                '}\n' +
                'input PetDetails {\n' +
                '    name: String\n' +
                '    type: String\n' +
                '    location: String\n' +
                '    weight: Int\n' +
                '}\n' +
                'input Params {\n' +
                '    id: ID!\n' +
                '    location: String\n' +
                '}';

            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const expected = buildSchema(expectedSchema);

            const merged = a.merge(b);
            assert.deepEqual(expected.diff(merged), []);
            done();
        });
    });
});
