import { DateRange, DateType, Quarters, QuartersAliases, QuartersKeys } from '../types/date';

import { TLocale } from './getLang';

interface LocaleArg {
    locale: TLocale;
}

export const createLocaleDate = (date: Date | string, { locale }: LocaleArg): string =>
    new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date));

export const currentLocaleDate = ({ locale }: LocaleArg): string => createLocaleDate(new Date(), { locale });

export const parseLocaleDate = (date: string | Date, { locale }: LocaleArg): Date => {
    let resolvedLocale: TLocale = locale;

    if (date?.toString().includes('/')) {
        resolvedLocale = 'en';
    }

    if (date?.toString().includes('.')) {
        resolvedLocale = 'ru';
    }

    const parsers: Record<TLocale, (date: string | Date) => Date> = {
        en: (date) => new Date(date),
        ru: (date) => {
            if (date.toString().includes('T') || date.toString().includes('/')) {
                return new Date(date);
            }

            const dateParts = date
                .toString()
                .split('.')
                // eslint-disable-next-line radix
                .map((p) => parseInt(p));
            return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        },
    };

    return parsers[resolvedLocale](date);
};

export const getYearFromDate = (date: Date | string): number => new Date(date).getFullYear();

export const getQuarterFromDate = (date: Date | string): QuartersKeys =>
    `Q${Math.floor(new Date(date).getMonth() / 3 + 1)}` as QuartersKeys;

export const getAvailableYears = (n = 5, currY = new Date().getFullYear()): number[] =>
    Array(n)
        .fill(0)
        .map((_, i) => currY + i);

export const createQuarterRange = (q: QuartersKeys, year?: number): DateRange => {
    const qToM = {
        [Quarters.Q1]: 2,
        [Quarters.Q2]: 5,
        [Quarters.Q3]: 8,
        [Quarters.Q4]: 11,
    };
    const abstractDate = new Date();

    abstractDate.setMonth(qToM[q], 0);

    if (year) {
        abstractDate.setFullYear(year);
    }

    const qEndDate = (date: number) => {
        const d = new Date(date);
        const quarter = Math.floor(d.getMonth() / 3);
        const start = new Date(d.getFullYear(), quarter * 3, 1);

        return {
            end: new Date(start.getFullYear(), start.getMonth() + 3, 0),
            start,
        };
    };

    return qEndDate(+abstractDate);
};

export const createYearRange = (year: number): DateRange => {
    const date = new Date();

    date.setFullYear(year);

    return {
        start: new Date(date.getFullYear(), 0, 1),
        end: new Date(date.getFullYear(), 11, 31),
    };
};

export const createDateRange = (year: number, quarter?: QuartersKeys | null): DateRange => {
    if (quarter) {
        return createQuarterRange(quarter, year);
    }

    return createYearRange(year);
};

export const createQuarterRangeFromDate = (value: Date): DateRange => {
    return createDateRange(getYearFromDate(value), getQuarterFromDate(value));
};

export const getRelativeQuarterRange = (target: QuartersAliases): DateRange => {
    const current = createQuarterRangeFromDate(new Date());

    if (target === QuartersAliases['@current']) {
        return current;
    }

    const endOfQuarter = current.end;

    if (target === QuartersAliases['@next']) {
        endOfQuarter.setMonth(endOfQuarter.getMonth() + 1);

        return createQuarterRangeFromDate(endOfQuarter);
    }

    const startOfQuarter = current.start ?? current.end;

    startOfQuarter.setMonth(startOfQuarter.getMonth() - 1);

    return createQuarterRangeFromDate(startOfQuarter);
};

const getMonthDifference = (start: Date, end: Date): number =>
    end.getMonth() - start.getMonth() + 12 * (end.getFullYear() - start.getFullYear());

export const getDateTypeFromRange = ({ start, end }: DateRange): DateType => {
    if (start && getMonthDifference(start, end) === 11) {
        return 'Year';
    }

    if (start && getMonthDifference(start, end) === 2) {
        return 'Quarter';
    }

    return 'Strict';
};

export const formateEstimate = (
    date: Date,
    {
        locale,
        type,
    }: {
        locale: TLocale;
        type?: DateType;
    },
): string => {
    if (type === 'Year') {
        return String(getYearFromDate(date));
    }

    if (type === 'Quarter') {
        return `${getQuarterFromDate(date)}/${getYearFromDate(date)}`;
    }

    return createLocaleDate(date, { locale });
};

export const dateAgo = (date: Date, pastDate: number, { locale }: LocaleArg): string | undefined => {
    const formatter = new Intl.RelativeTimeFormat(locale, { style: 'long', numeric: 'auto' });

    const divisions: Array<{ amount: number; name: Intl.RelativeTimeFormatUnit }> = [
        { amount: 60, name: 'seconds' },
        { amount: 60, name: 'minutes' },
        { amount: 24, name: 'hours' },
        { amount: 7, name: 'days' },
        { amount: 4.34524, name: 'weeks' },
        { amount: 12, name: 'months' },
        { amount: Number.POSITIVE_INFINITY, name: 'years' },
    ];

    let duration = (Number(date) - pastDate) / 1000;

    for (let i = 0; i <= divisions.length; i++) {
        const division = divisions[i];
        if (Math.abs(duration) < division.amount) {
            return formatter.format(Math.round(duration), division.name);
        }
        duration /= division.amount;
    }
};

export const isPastDate = (date: Date | string): boolean => new Date(date) < new Date();

// Return string in format yyyy-mm-dd from Estimate value (in UTC timezone)

export const getDateStringFromEstimate = (date: Date | string) => new Date(date).toISOString().split('T')[0];
const pad = (num: number) => (num < 10 ? '0' : '') + num;

// Return string in format yyyy-mm-dd from local Date

export const getDateString = (date: Date | string) => {
    const parsedDate = new Date(date);

    return `${parsedDate.getFullYear()}-${pad(parsedDate.getMonth() + 1)}-${pad(parsedDate.getDate())}`;
};

const urlDateRangeSeparator = '~';

export const encodeUrlDateRange = ({ start, end }: DateRange): string =>
    [start ? getDateString(start) : '', getDateString(end)].join(urlDateRangeSeparator);

export const decodeUrlQuarterAlias = (data: string): QuartersAliases | null => {
    if (Object.keys(QuartersAliases).includes(data)) {
        return data as QuartersAliases;
    }

    return null;
};

export const decodeUrlDateRange = (data: string): null | DateRange => {
    const alias = decodeUrlQuarterAlias(data);

    if (alias) {
        return getRelativeQuarterRange(alias);
    }

    const [start = null, end] = data.split(urlDateRangeSeparator);

    if (!end) {
        return null;
    }

    return {
        start: start ? new Date(start) : null,
        end: new Date(end),
    };
};

export const encodeHistoryEstimate = (date: Date, type: DateType) =>
    JSON.stringify({
        date: getDateString(date),
        type,
    });

export const decodeHistoryEstimate = (data: string): { date: Date; type: DateType } | null => {
    try {
        const estimate = JSON.parse(data);

        if (typeof estimate !== 'object' || !estimate.date) {
            return null;
        }

        return {
            date: new Date(estimate.date),
            type: estimate.type ?? 'Strict',
        };
    } catch (e) {
        return null;
    }
};

export const calculateElapsedDays = (startDate: Date | string) => {
    const date = new Date(startDate);
    const timeDifference = new Date().getTime() - date.getTime();
    return Math.floor(timeDifference / (1000 * 60 * 60 * 24));
};

export const decodeEstimateFromUrl = (value?: string): EstimateValue | undefined => {
    if (!value) {
        return undefined;
    }

    const range = decodeUrlDateRange(value);

    if (!range) {
        return undefined;
    }

    return {
        range,
        type: getDateTypeFromRange(range),
        alias: decodeUrlQuarterAlias(value) || undefined,
    };
};

interface EstimateValue {
    type: DateType;
    range: DateRange;
    alias?: QuartersAliases;
}
export const getEstimateLabel = (estimate: EstimateValue, locale: TLocale): string =>
    estimate.alias
        ? estimate.alias
        : formateEstimate(estimate.range.end, {
              locale,
              type: estimate.type,
          });
