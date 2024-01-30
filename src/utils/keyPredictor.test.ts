import { test, describe } from 'node:test';
import assert from 'node:assert';

import { keyPredictor } from './keyPredictor';

describe('keyPredictor', () => {
    test('empty is empty', () => {
        assert.strictEqual(keyPredictor(''), '');
    });

    test('changes to uppercase', () => {
        assert.strictEqual(keyPredictor('brg'), 'BRG');
    });

    test('10 symbols maximum', () => {
        assert.strictEqual(keyPredictor('GBDCXDRTMLPCSWMNDRKLVZ'), 'GBDCXDRTML');
    });

    test('removes vowel letters', () => {
        assert.strictEqual(keyPredictor('ABCDEFG'), 'BCDFG');
    });

    test('removes special characters', () => {
        assert.strictEqual(keyPredictor('-—+={}[]?!.,&^%:#@"()/<>|\\~`*;'), '');
    });

    test('trims and removes extra spaces', () => {
        assert.strictEqual(keyPredictor(' GBDC XDRTML '), 'GBDCXDRTML');
    });

    test('removes unicode', () => {
        assert.strictEqual(keyPredictor('😎GBDC😍XDRTML♥'), 'GBDCXDRTML');
    });

    test('do not remove vowels', () => {
        assert.strictEqual(keyPredictor('AEOIUYW', { allowVowels: true }), 'AEOIUYW');
    });

    test('correct with numbers', () => {
        assert.strictEqual(keyPredictor('front1234end'), 'FRNT1234ND');
    });
});
