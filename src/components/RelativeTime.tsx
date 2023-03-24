import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useMounted } from '@common/hooks/useMounted';

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
    const [time, setTime] = useState(ssrTime);
    const mounted = useMounted(0);
    const localeDate = parseLocaleDate(date, { locale });

    useEffect(() => {
        setTime(Date.now());
    }, [mounted]);

    useEffect(() => {
        setTimeout(() => {
            setTime(Date.now());
        }, 100); // TODO: use a better interval?
    }, []);

    return (
        <>
            {kind ? `${t(kind)} ` : ''}
            <Light title={createLocaleDate(localeDate, { locale })}>{dateAgo(localeDate, time, { locale })}</Light>
        </>
    );
};

export default RelativeTime;
