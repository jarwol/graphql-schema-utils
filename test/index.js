'use strict';

const assert = require('assert'),
    buildSchema = require('graphql').buildSchema;

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
            assert(diffs.includes('Type missing from this schema: Video'));
            assert(diffs.includes('Type missing from other schema: FieldOption'));
            assert(diffs.includes('Field missing from other: `Query.FieldOption(contentId: ID!): FieldOption`'));
            assert(diffs.includes('Field missing from this: `Query.Video(contentId: ID!): Video`'));
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
            assert(diffs.includes('Field missing from other: `FieldOption.displayName: String`'));
            assert(diffs.includes('Field missing from this: `FieldOption.newValue: String`'));
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
            assert.equal(diffs[0], 'Interface diff on type FieldOption: `CmsItem, NewInterface vs. CmsItem`');
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
            assert.equal(diffs[0], 'Field diff on type FieldOption: `value: String vs. value: Boolean!`');
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
            assert(diffs.includes('Description diff on field Query.FieldOption: `"Query for FieldOptions" vs. "FieldOption Query"`'));
            assert(diffs.includes('Description diff on field CmsItem.contentId: `"Content ID" vs. ""`'));
            assert(diffs.includes('Description diff on type CmsItem: `"Base type for CMS content" vs. "Base CMS type"`'));
            assert(diffs.includes('Description diff on argument Query.FieldOption(contentId): `"" vs. "The content ID"`'));
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
                '}';
            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert.equal(diffs.length, 2);
            assert(diffs.includes('Field diff on type FieldOption: `value(places: String): String vs. value: String`'));
            assert(diffs.includes('Field diff on type FieldOption: `displayName: String vs. displayName(caps: Boolean): String`'));
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
                '}\n' +
                'enum Car {\n' +
                '    HONDA\n' +
                '    BMW\n' +
                '}';
            const a = buildSchema(schema1);
            const b = buildSchema(schema2);
            const diffs = a.diff(b);
            assert.equal(diffs[0], 'Enum values differ in type Color');
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
            assert.equal(diffs[0], 'Difference in union type Pet: `Cat | Dog vs. Cat | Dog | Fish`');
            done();
        });
    });

    describe('#merge()', function () {
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
    });
});
