/* eslint-disable */
// Do not edit, use generator to update
import { i18n, fmt, I18nLangSet } from 'easy-typed-intl';
import getLang from '../../../utils/getLang';

import en from './en.json';
import ru from './ru.json';

export type I18nKey = keyof typeof en & keyof typeof ru;
type I18nLang = 'en' | 'ru';

const keyset: I18nLangSet<I18nKey> = {};

keyset['en'] = en;
keyset['ru'] = ru;

export const tr = i18n<I18nLang, I18nKey>(keyset, fmt, getLang);
