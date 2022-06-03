import { useTranslations } from 'next-intl';

import { dateAgo, currentDate } from '../utils/dateTime';

import { Light } from './Light';

interface RelativeTimeProps {
    kind?: 'created' | 'updated' | 'Created' | 'Updated';
    date: string;
}

export const RelativeTime: React.FC<RelativeTimeProps> = ({ kind, date }) => {
    const t = useTranslations('RelativeTime');

    return (
        <>
            {kind ? `${t('Updated')} ` : ''}
            <Light title={currentDate(new Date(date))}>{dateAgo(date)}</Light>
        </>
    );
};
