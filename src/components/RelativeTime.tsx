import { useTranslations } from 'next-intl';

import { dateAgo, currentDate } from '../utils/dateTime';

import { Light } from './Light';

interface RelativeTimeProps {
    date: string;
    locale: 'en' | 'ru';
    kind?: 'created' | 'updated' | 'Created' | 'Updated';
}

const RelativeTime: React.FC<RelativeTimeProps> = ({ kind, date, locale }) => {
    const t = useTranslations('RelativeTime');

    return (
        <>
            {kind ? `${t(kind)} ` : ''}
            <Light title={currentDate(new Date(date))}>{dateAgo(date, { locale })}</Light>
        </>
    );
};

export default RelativeTime;
