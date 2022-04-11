import { quarterFromDate, yearFromDate, availableYears, createLocaleDate, estimatedMeta } from './dateTime';

test('returns right quarter for default locale', () => {
    expect(quarterFromDate('11/02/2054')).toBe('Q4');
});

test('returns right quarter for passed locale', () => {
    expect(quarterFromDate('02.11.2054', { locale: 'ru' })).toBe('Q4');
});

test('returns right year for default locale', () => {
    expect(yearFromDate('11/02/2054')).toBe(2054);
});

test('returns right year for passed locale', () => {
    expect(yearFromDate('02.11.2054', { locale: 'ru' })).toBe(2054);
});

test('returns locale date for default locale', () => {
    expect(new Date(createLocaleDate('11/02/2054')).getFullYear()).toBe(2054);
});

test('returns locale date for passed locale', () => {
    expect(new Date(createLocaleDate('02.11.2054', { locale: 'ru' })).getFullYear()).toBe(2054);
});

test('returns available years for passed number', () => {
    expect(availableYears(6)).toStrictEqual([2022, 2023, 2024, 2025, 2026, 2027]);
});

test('returns meta for passed date and default locale', () => {
    expect(estimatedMeta('11/02/2054')).toStrictEqual({ quarter: 'Q4', year: 2054 });
});

test('returns meta for passed date and passed locale', () => {
    expect(estimatedMeta('02.11.2054', { locale: 'ru' })).toStrictEqual({ quarter: 'Q4', year: 2054 });
});
