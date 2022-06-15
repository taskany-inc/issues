import parseDate from 'date-fns/parse';
import getQuarter from 'date-fns/getQuarter';
import getYear from 'date-fns/getYear';
import format from 'date-fns/format';
import setMonth from 'date-fns/setMonth';
import lastDayOfQuarter from 'date-fns/lastDayOfQuarter';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import ruLocale from 'date-fns/locale/ru';
import isPast from 'date-fns/isPast';

export const localeFormatMap = {
    ru: 'dd.MM.yyyy',
    en: 'MM/dd/yyyy',
};

type LocaleArg = {
    locale: keyof typeof localeFormatMap;
};

const localeArgDefault: LocaleArg = { locale: 'en' };

export enum quarters {
    'Q1' = 'Q1',
    'Q2' = 'Q2',
    'Q3' = 'Q3',
    'Q4' = 'Q4',
}

export const createLocaleDate = (date: string, { locale }: LocaleArg = localeArgDefault) =>
    parseDate(date, localeFormatMap[locale], new Date());

export const yearFromDate = (date: string, { locale }: LocaleArg = localeArgDefault) =>
    getYear(createLocaleDate(date, { locale }));

export const currentDate = (date = new Date(), { locale }: LocaleArg = localeArgDefault) =>
    format(date, localeFormatMap[locale]);

export const endOfQuarter = (q: string, date = new Date(), { locale }: LocaleArg = localeArgDefault) => {
    const qToM = {
        [quarters.Q1]: 2,
        [quarters.Q2]: 5,
        [quarters.Q3]: 8,
        [quarters.Q4]: 11,
    };

    const abstractDate = setMonth(date, qToM[q as quarters]);
    return currentDate(lastDayOfQuarter(abstractDate), { locale });
};

export const quarterFromDate = (date = new Date()) => `Q${getQuarter(date)}` as quarters;

export const availableYears = (n = 5, currY = new Date().getFullYear()) =>
    Array(n)
        .fill(0)
        .map((_, i) => currY + i);

export const estimatedMeta = (date = new Date(), { locale }: LocaleArg = localeArgDefault) => {
    const q = quarterFromDate(date);

    return {
        date: endOfQuarter(q, date, { locale }),
        q,
    };
};

export const dateAgo = (date: string, { locale }: LocaleArg = localeArgDefault) => {
    return formatDistanceToNow(new Date(date), { locale: locale === 'ru' ? ruLocale : undefined, addSuffix: true });
};

export const isPastDate = (date: string): boolean => {
    return isPast(new Date(date))
}
