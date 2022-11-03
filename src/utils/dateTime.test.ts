import { availableYears, createLocaleDate, currentDate, endOfQuarter, quarters } from './dateTime';

test('returns formatted date for default locale', () => {
    expect(currentDate(new Date(2054, 10, 2))).toBe('11/2/2054');
});

test('returns formatted date for passed locale', () => {
    expect(currentDate(new Date(2054, 10, 2), { locale: 'ru' })).toBe('02.11.2054');
});

test('returns locale date for default locale', () => {
    expect(new Date(createLocaleDate('11/2/2054')).getFullYear()).toBe(2054);
});

test('returns locale date for passed locale', () => {
    expect(new Date(createLocaleDate('02.11.2054', { locale: 'ru' })).getFullYear()).toBe(2054);
});

test('returns lastDayOfQuarter for default locale', () => {
    expect(endOfQuarter(quarters.Q4)).toBe(`12/31/${new Date().getFullYear()}`);
});

test('returns available years for passed number', () => {
    expect(availableYears(6)).toStrictEqual([2022, 2023, 2024, 2025, 2026, 2027]);
});
