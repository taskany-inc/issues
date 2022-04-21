import {
    quarterFromDate,
    availableYears,
    createLocaleDate,
    estimatedMeta,
    currentDate,
    endOfQuarter,
    quarters,
} from './dateTime';

test('returns right quarter', () => {
    expect(quarterFromDate(new Date(2054, 10, 2))).toBe('Q4');
});

test('returns formatted date for default locale', () => {
    expect(currentDate(new Date(2054, 10, 2))).toBe('11/02/2054');
});

test('returns formatted date for passed locale', () => {
    expect(currentDate(new Date(2054, 10, 2), { locale: 'ru' })).toBe('02.11.2054');
});

test('returns locale date for default locale', () => {
    expect(new Date(createLocaleDate('11/02/2054')).getFullYear()).toBe(2054);
});

test('returns locale date for passed locale', () => {
    expect(new Date(createLocaleDate('02.11.2054', { locale: 'ru' })).getFullYear()).toBe(2054);
});

test('returns lastDayOfQuarter for default locale', () => {
    expect(endOfQuarter(quarters.Q4, new Date(2054, 10, 2))).toBe('12/31/2054');
});

test('returns available years for passed number', () => {
    expect(availableYears(6)).toStrictEqual([2022, 2023, 2024, 2025, 2026, 2027]);
});

test('returns meta for passed date and default locale', () => {
    expect(estimatedMeta(new Date(2054, 10, 2))).toStrictEqual({ q: 'Q4', date: '12/31/2054' });
});

test('returns meta for passed date and passed locale', () => {
    expect(estimatedMeta(new Date(2054, 10, 2), { locale: 'ru' })).toStrictEqual({ q: 'Q4', date: '31.12.2054' });
});
