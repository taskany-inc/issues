export const languages = ['en', 'ru'] as const;

export type TLocale = (typeof languages)[number];

export const defaultLocale: TLocale = languages[0];

let SSRLocale: TLocale | null = null;

export const setSSRLocale = (locale: TLocale): void => {
    SSRLocale = locale;
};

export default function getLang(): TLocale {
    return SSRLocale ?? defaultLocale;
}
