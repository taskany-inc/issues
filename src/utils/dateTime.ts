import parseDate from 'date-fns/parse';
import getQuarter from 'date-fns/getQuarter';
import getYear from 'date-fns/getYear';

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

export const quarterFromDate = (date: string, { locale }: LocaleArg = localeArgDefault) =>
    `Q${getQuarter(createLocaleDate(date, { locale }))}` as quarters;

export const yearFromDate = (date: string, { locale }: LocaleArg = localeArgDefault) =>
    getYear(createLocaleDate(date, { locale }));

export const availableYears = (n: number = 5, currY = new Date().getFullYear()) =>
    Array(n)
        .fill(0)
        .map((_, i) => currY + i);

export const estimatedMeta = (date: string, { locale }: LocaleArg = localeArgDefault) => ({
    year: yearFromDate(date, { locale }),
    quarter: quarterFromDate(date, { locale }),
});
