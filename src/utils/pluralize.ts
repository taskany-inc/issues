import { TLocale } from '../i18n/getLang';

interface PluralizeProps {
    locale: TLocale;
    count: number;
    one: string;
    few: string;
    many: string;
}

export const pluralize = ({ locale, count, one, few, many }: PluralizeProps) => {
    const pluralRules = new Intl.PluralRules(locale);
    const grammaticalNumber = pluralRules.select(count);
    switch (grammaticalNumber) {
        case 'one':
            return one;
        case 'few':
            return few;
        case 'many':
            return many;
        case 'other':
            return many;
        default:
            throw new Error(`Unknown: ${grammaticalNumber}`);
    }
};
