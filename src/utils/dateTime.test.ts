import { TLocale } from '../types/locale';

import { availableYears, createLocaleDate, parseLocaleDate, endOfQuarter, quarters } from './dateTime';

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
    expect(createLocaleDate(endOfQuarter(quarters.Q4), { locale: 'en' })).toBe(`12/31/${new Date().getFullYear()}`);
});

test('returns available years for passed number', () => {
    expect(availableYears(6)).toStrictEqual([2022, 2023, 2024, 2025, 2026, 2027]);
});
