import { useTranslations } from 'next-intl';

import { dateAgo, createLocaleDate, parseLocaleDate } from '../utils/dateTime';
import { usePageContext } from '../hooks/usePageContext';

import { Light } from './Light';

interface RelativeTimeProps {
    date: string;
    kind?: 'created' | 'updated' | 'Created' | 'Updated';
}

const RelativeTime: React.FC<RelativeTimeProps> = ({ kind, date }) => {
    const t = useTranslations('RelativeTime');
    const { locale, ssrTime } = usePageContext();
    const localeDate = parseLocaleDate(date, { locale });

    return (
        <>
            {kind ? `${t(kind)} ` : ''}
            <Light title={createLocaleDate(localeDate, { locale })}>
                {dateAgo(localeDate, ssrTime || Date.now(), { locale })}
            </Light>
        </>
    );
};

export default RelativeTime;
