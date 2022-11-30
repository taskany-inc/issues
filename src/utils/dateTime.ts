import { TLocale } from '../types/locale';

type LocaleArg = {
    locale: TLocale;
};

export enum quarters {
    'Q1' = 'Q1',
    'Q2' = 'Q2',
    'Q3' = 'Q3',
    'Q4' = 'Q4',
}

export const createLocaleDate = (date: Date, { locale }: LocaleArg) => new Intl.DateTimeFormat(locale).format(date);

export const yearFromDate = (date: Date) => date.getFullYear();

export const currentLocaleDate = ({ locale }: LocaleArg) => new Intl.DateTimeFormat(locale).format(new Date());

export const endOfQuarter = (q: string) => {
    const qToM = {
        [quarters.Q1]: 2,
        [quarters.Q2]: 5,
        [quarters.Q3]: 8,
        [quarters.Q4]: 11,
    };

    const abstractDate = new Date().setMonth(qToM[q as quarters]);

    const qEndDate = (date: number) => {
        const d = new Date(date);
        const quarter = Math.floor(d.getMonth() / 3);
        const startDate = new Date(d.getFullYear(), quarter * 3, 1);
        return new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
    };

    return qEndDate(abstractDate);
};

export const quarterFromDate = (date: Date) => `Q${Math.floor(date.getMonth() / 3 + 1)}` as quarters;

export const availableYears = (n = 5, currY = new Date().getFullYear()) =>
    Array(n)
        .fill(0)
        .map((_, i) => currY + i);

export const estimatedMeta = ({ locale }: LocaleArg) => {
    const q = quarterFromDate(new Date());

    return {
        date: createLocaleDate(endOfQuarter(q), { locale }),
        q,
    };
};

export const dateAgo = (date: Date, pastDate: number, { locale }: LocaleArg) => {
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

export const isPastDate = (date: Date): boolean => date < new Date();

export const parseLocaleDate = (date: string, { locale }: LocaleArg) => {
    let resolvedLocale: TLocale = locale;

    if (date.includes('/')) {
        resolvedLocale = 'en';
    }

    if (date.includes('.')) {
        resolvedLocale = 'ru';
    }

    const parsers: Record<TLocale, (date: string) => Date> = {
        en: (date) => new Date(date),
        ru: (date) => {
            if (date.includes('T') || date.includes('/')) {
                return new Date(date);
            }

            // eslint-disable-next-line radix
            const dateParts = date.split('.').map((p) => parseInt(p));
            return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        },
    };

    return parsers[resolvedLocale](date);
};

const createValue = (date: string | Date, locale: TLocale) => {
    const localDate = typeof date === 'object' ? date : parseLocaleDate(date, { locale });

    return {
        q: quarterFromDate(localDate) as string,
        y: String(yearFromDate(localDate)),
        date: createLocaleDate(localDate, { locale }),
    };
};

export const formatEstimate = (estimate: ReturnType<typeof createValue>, locale: TLocale) => {
    const { date, q, y } = createValue(estimate.date, locale);

    return date === createLocaleDate(endOfQuarter(q), { locale }) ? `${q}/${y}` : date;
};
