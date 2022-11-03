import { useTranslations } from 'next-intl';

import { TLocale } from '../types/locale';
import { dateAgo, createLocaleDate, parseLocaleDate } from '../utils/dateTime';

import { Light } from './Light';

interface RelativeTimeProps {
    date: string;
    locale: TLocale;
    kind?: 'created' | 'updated' | 'Created' | 'Updated';
}

const RelativeTime: React.FC<RelativeTimeProps> = ({ kind, date, locale }) => {
    const t = useTranslations('RelativeTime');
    const localeDate = parseLocaleDate(date, { locale });

    return (
        <>
            {kind ? `${t(kind)} ` : ''}
            <Light title={createLocaleDate(localeDate, { locale })}>{dateAgo(localeDate, { locale })}</Light>
        </>
    );
};

export default RelativeTime;
