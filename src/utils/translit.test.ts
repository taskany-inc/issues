import { describe, it } from 'node:test';
import assert from 'node:assert';

import { translit } from './translit';

describe('translit', () => {
    it('should transliterate Russian text to English', () => {
        assert.deepStrictEqual(translit('каталог'), 'katalog');
    });

    it('should transliterate English text to Russian', () => {
        assert.deepStrictEqual(translit('katalog'), 'каталог');
    });

    it('should return the same text if it contains neither Russian nor English characters', () => {
        assert.deepStrictEqual(translit('12345'), '12345');
    });

    it('should handle empty string input', () => {
        assert.deepStrictEqual(translit(''), '');
    });
});
