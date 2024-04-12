import { useEffect, useState } from 'react';
import { nullable, useMounted } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';
import cn from 'classnames';

import { dateAgo, createLocaleDate, parseLocaleDate } from '../../utils/dateTime';
import { usePageContext } from '../../hooks/usePageContext';
import { useLocale } from '../../hooks/useLocale';

import { tr } from './RelativeTime.i18n';
import s from './RelativeTime.module.css';

type RelativeTimeKindCommon = 'created' | 'updated';
type RelativeTimeKind = RelativeTimeKindCommon | Capitalize<RelativeTimeKindCommon>;

interface RelativeTimeProps {
    date: Date;
    kind?: RelativeTimeKind;
    isRelativeTime?: boolean;
    className?: string;
    size?: 's' | 'xs';
}

export const RelativeTime: React.FC<RelativeTimeProps> = ({
    kind,
    date,
    isRelativeTime = true,
    size = 's',
    className,
}) => {
    const { ssrTime } = usePageContext();
    const locale = useLocale();
    const [time, setTime] = useState(ssrTime);
    const mounted = useMounted(0);
    const localeDate = parseLocaleDate(date, { locale });

    useEffect(() => {
        setTime(Date.now());
    }, [mounted]);

    const map: Record<RelativeTimeKind, string> = {
        created: tr('created'),
        updated: tr('updated'),
        Created: tr('Created'),
        Updated: tr('Updated'),
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(Date.now());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const timeValue = isRelativeTime ? dateAgo(localeDate, time, { locale }) : createLocaleDate(localeDate, { locale });

    return (
        <Text size={size} className={cn(s.RelativeTime, className)}>
            {nullable(kind, (k) => (
                <span className={s.RelativeTimeKind}>{map[k]}</span>
            ))}
            <span title={createLocaleDate(localeDate, { locale })}>{timeValue}</span>
        </Text>
    );
};
