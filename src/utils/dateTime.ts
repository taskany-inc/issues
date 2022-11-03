type LocaleArg = {
    locale: 'ru' | 'en';
};

const localeArgDefault: LocaleArg = { locale: 'en' };

export enum quarters {
    'Q1' = 'Q1',
    'Q2' = 'Q2',
    'Q3' = 'Q3',
    'Q4' = 'Q4',
}

export const createLocaleDate = (date?: string, { locale }: LocaleArg = localeArgDefault) =>
    new Intl.DateTimeFormat(locale).format(date ? new Date(date) : new Date());

export const yearFromDate = (date: string, { locale }: LocaleArg = localeArgDefault) =>
    new Date(createLocaleDate(date, { locale })).getFullYear();

export const currentDate = (date: string | Date, { locale }: LocaleArg = localeArgDefault) =>
    new Intl.DateTimeFormat(locale).format(new Date(date));

export const endOfQuarter = (q: string, { locale }: LocaleArg = localeArgDefault) => {
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

    return currentDate(qEndDate(abstractDate), { locale });
};

export const quarterFromDate = (date = new Date()) => `Q${Math.floor(date.getMonth() / 3 + 1)}` as quarters;

export const availableYears = (n = 5, currY = new Date().getFullYear()) =>
    Array(n)
        .fill(0)
        .map((_, i) => currY + i);

export const estimatedMeta = ({ locale }: LocaleArg = localeArgDefault) => {
    const q = quarterFromDate();

    return {
        date: endOfQuarter(q, { locale }),
        q,
    };
};

export const dateAgo = (date: string, { locale }: LocaleArg = localeArgDefault) => {
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

    let duration = (Number(new Date(date)) - Number(new Date())) / 1000;

    for (let i = 0; i <= divisions.length; i++) {
        const division = divisions[i];
        if (Math.abs(duration) < division.amount) {
            return formatter.format(Math.round(duration), division.name);
        }
        duration /= division.amount;
    }
};

export const isPastDate = (date: string): boolean => new Date(date) < new Date();
