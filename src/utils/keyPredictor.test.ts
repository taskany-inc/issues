import { keyPredictor } from './keyPredictor';

describe('keyPredictor', () => {
    test('empty is empty', () => {
        expect(keyPredictor('')).toBe('');
    });

    test('changes to uppercase', () => {
        expect(keyPredictor('brg')).toBe('BRG');
    });

    test('10 symbols maximum', () => {
        expect(keyPredictor('GBDCXDRTMLPCSWMNDRKLVZ')).toBe('GBDCXDRTML');
    });

    test('removes vowel letters', () => {
        expect(keyPredictor('ABCDEFG')).toBe('BCDFG');
    });

    test('removes special characters', () => {
        expect(keyPredictor('-—+={}[]?!.,&^%:#@"()/<>|\\~`*;')).toBe('');
    });

    test('trims and removes extra spaces', () => {
        expect(keyPredictor(' GBDC XDRTML ')).toBe('GBDCXDRTML');
    });

    test('removes unicode', () => {
        expect(keyPredictor('😎GBDC😍XDRTML♥')).toBe('GBDCXDRTML');
    });
});
