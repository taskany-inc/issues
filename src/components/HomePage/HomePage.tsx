import { ExternalPageProps } from '../../utils/declareSsrProps';
import { Page } from '../Page';

import { tr } from './HomePage.i18n';

export const HomePage = ({ user, ssrTime, locale }: ExternalPageProps) => (
    <Page user={user} locale={locale} ssrTime={ssrTime} title={tr('title')} />
);
