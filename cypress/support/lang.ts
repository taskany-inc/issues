import { i18n, fmt, I18nLangSet } from 'easy-typed-intl';

import type * as translations from '../fixtures/langs.json';
import getLang from '../../src/utils/getLang';

type TranslationsNamespaces = keyof typeof translations;
type PickKeyset<K> = K extends TranslationsNamespaces ? keyof (typeof translations)[K] : never;

type GetTranslationReturnType<M extends { [key: string]: string[] }> = {
    [K in keyof M]: {
        [K1 in M[K][number]]: <T extends Record<string, unknown>>(value?: T) => string;
    };
};

interface GetTranslation {
    <K extends TranslationsNamespaces, M extends { [K1 in K]?: PickKeyset<K1>[] }>(map: M): GetTranslationReturnType<M>;
}

/**
 * Function must be call inside tests hooks or test body, like `it / spec / test` only
 */
export const getTranslation: GetTranslation = (map) => {
    const dict = Cypress.env('translations');

    return (Object.keys(map) as (keyof typeof dict)[]).reduce<GetTranslationReturnType<typeof map>>((acc, key) => {
        const source = dict[key];
        const keys = map[key] as string[];

        const keyset: I18nLangSet<string> = {};

        keyset.ru = {};
        keyset.en = {};

        for (const [k, translate] of Object.entries(source)) {
            if (keys.includes(k)) {
                keyset.ru = {
                    ...keyset.ru,
                    [k]: translate.ru,
                };

                keyset.en = {
                    ...keyset.en,
                    [k]: translate.en,
                };
            }
        }

        const tr = i18n(keyset, fmt, getLang);

        acc[key] = keys.reduce((trObj, k) => {
            trObj[k] = <T extends Record<string, unknown>>(val?: T) => tr.raw(k, val).join('');
            return trObj;
        }, {});

        return acc;
    }, {} as GetTranslationReturnType<typeof map>);
};
