import { DateRange, DateRangeType, formateEstimate, getDateString, QuartersAliases } from '@taskany/bricks';

import { TLocale } from './getLang';

interface LocaleArg {
    locale: TLocale;
}

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

// Return string in format yyyy-mm-dd from Estimate value (in UTC timezone)

export const getDateStringFromEstimate = (date: Date | string) => new Date(date).toISOString().split('T')[0];

export const encodeHistoryEstimate = (date: Date, type: DateRangeType) =>
    JSON.stringify({
        date: getDateString(date),
        type,
    });

export const decodeHistoryEstimate = (data: string): { date: Date; type: DateRangeType } | null => {
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

interface EstimateValue {
    type: DateRangeType;
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
