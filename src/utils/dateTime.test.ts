import test from 'node:test';
import assert from 'node:assert';

import { Quarters } from '../types/date';

import { TLocale } from './getLang';
import { getAvailableYears, createLocaleDate, parseLocaleDate, createQuarterRange } from './dateTime';

const locales: Array<TLocale> = ['en', 'ru'];

locales.forEach((locale) => {
    test(`returns formatted date for ${locale} locale`, () => {
        const dateString = createLocaleDate(new Date(2054, 10, 2), { locale });
        assert.strictEqual(parseLocaleDate(dateString, { locale }).getDay(), 1);
        assert.strictEqual(parseLocaleDate(dateString, { locale }).getMonth(), 10);
        assert.strictEqual(parseLocaleDate(dateString, { locale }).getFullYear(), 2054);
    });
});

test('returns locale date for en locale', () => {
    assert.strictEqual(new Date(parseLocaleDate('11/2/2054', { locale: 'en' })).getFullYear(), 2054);
});

test('returns locale date for ru locale', () => {
    assert.strictEqual(new Date(parseLocaleDate('02.11.2054', { locale: 'ru' })).getFullYear(), 2054);
});

test('returns lastDayOfQuarter for en locale', () => {
    assert.strictEqual(
        createLocaleDate(createQuarterRange(Quarters.Q4).end, { locale: 'en' }),
        `12/31/${new Date().getFullYear()}`,
    );
});

test('returns available years for passed number', () => {
    const currentYear = new Date().getFullYear();
    assert.deepStrictEqual(
        getAvailableYears(6),
        Array.from({ length: 6 }).map((_, index) => currentYear + index),
    );
});
