const languages = ['en', 'ru'] as const;

export type TLocale = (typeof languages)[number];

const defaultLocale: TLocale = languages[0];

const getLangClient = (): TLocale => {
    const [_, locale] = window.location.pathname.match(new RegExp(`/(${languages.join('|')})/`)) ?? [];

    return (locale as TLocale) ?? defaultLocale;
};

let SSRLocale: TLocale | null = null;

export const setSSRLocale = (locale: TLocale): void => {
    SSRLocale = locale;
};

export default function getLang(): TLocale {
    if (typeof window !== 'undefined') {
        return getLangClient();
    }

    return SSRLocale ?? defaultLocale;
}
