import { test, expect } from '@jest/globals';

import { TLocale } from './getLang';
import {
    getAvailableYears,
    createLocaleDate,
    parseLocaleDate,
    quarters,
    incYearIfDateHasPassed,
    createQuarterRange,
} from './dateTime';

const locales: Array<TLocale> = ['en', 'ru'];

locales.forEach((locale) => {
    test(`returns formatted date for ${locale} locale`, () => {
        const dateString = createLocaleDate(new Date(2054, 10, 2), { locale });
        expect(parseLocaleDate(dateString, { locale }).getDay()).toBe(1);
        expect(parseLocaleDate(dateString, { locale }).getMonth()).toBe(10);
        expect(parseLocaleDate(dateString, { locale }).getFullYear()).toBe(2054);
    });
});

test('returns locale date for en locale', () => {
    expect(new Date(parseLocaleDate('11/2/2054', { locale: 'en' })).getFullYear()).toBe(2054);
});

test('returns locale date for ru locale', () => {
    expect(new Date(parseLocaleDate('02.11.2054', { locale: 'ru' })).getFullYear()).toBe(2054);
});

test('returns lastDayOfQuarter for en locale', () => {
    expect(createLocaleDate(createQuarterRange(quarters.Q4).end, { locale: 'en' })).toBe(
        `12/31/${new Date().getFullYear()}`,
    );
});

test('returns available years for passed number', () => {
    expect(getAvailableYears(6)).toStrictEqual([2023, 2024, 2025, 2026, 2027, 2028]);
});

describe('increment year if the date has passed', () => {
    it('should not increment', () => {
        const currentDate = new Date();
        const futureDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth());

        const result = incYearIfDateHasPassed(futureDate);
        expect(result).toEqual(futureDate);
    });

    it('should increment', () => {
        const currentDate = new Date();
        const expectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDay());
        let pastDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDay());

        pastDate = incYearIfDateHasPassed(pastDate);
        expect(pastDate).toEqual(expectedDate);
    });
});
