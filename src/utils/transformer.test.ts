import { describe, it } from 'node:test';
import assert from 'node:assert';

import { deserialize, serialize } from './transformer';

const dateString = '_serializedDate_1970-01-01T00:00:00.000Z';
const undefinedString = '_undefined_';

describe('Transformer', () => {
    it('should serialize and deserialize', async () => {
        const values = [
            { from: 1, to: 1 },
            { from: 'a', to: 'a' },
            { from: new Date(0), to: dateString },
            { from: undefined, to: undefinedString },
            { from: [], to: [] },
            { from: ['a', 1, new Date(0), [new Date(0)]], to: ['a', 1, dateString, [dateString]] },
            { from: ['a', [new Date(0)]], to: ['a', [dateString]] },
            { from: [undefined, [[undefined]]], to: [undefinedString, [[undefinedString]]] },
            { from: {}, to: {} },
            { from: { a: { b: new Date(0), c: {} } }, to: { a: { b: dateString, c: {} } } },
            { from: { a: { b: null } }, to: { a: { b: null } } },
        ];
        for (const { from, to } of values) {
            const serialized = serialize(from);
            assert.deepStrictEqual(serialized, to);
            const deserialized = deserialize(to);
            assert.deepStrictEqual(deserialized, from);
        }
    });
});
