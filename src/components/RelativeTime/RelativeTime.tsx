import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { nullable, useMounted } from '@taskany/bricks';
import { gapXs } from '@taskany/colors';

import { dateAgo, createLocaleDate, parseLocaleDate } from '../../utils/dateTime';
import { usePageContext } from '../../hooks/usePageContext';
import { Light } from '../Light';
import { useLocale } from '../../hooks/useLocale';

import { tr } from './RelativeTime.i18n';

type RelativeTimeKindCommon = 'created' | 'updated';
type RelativeTimeKind = RelativeTimeKindCommon | Capitalize<RelativeTimeKindCommon>;

interface RelativeTimeProps {
    date: Date;
    kind?: RelativeTimeKind;
    isRelativeTime?: boolean;
    hover?: boolean;
}

const StyledTimeValue = styled.span`
    &::first-letter {
        text-transform: capitalize;
    }
`;

const StyledKind = styled.span`
    padding-right: ${gapXs};
`;

const StyledRelativeTime = styled.span`
    display: flex;
    align-items: center;
`;

export const RelativeTime: React.FC<RelativeTimeProps> = ({ kind, date, isRelativeTime = true, hover = false }) => {
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
        <StyledRelativeTime>
            {nullable(kind, (k) => (
                <StyledKind>{map[k]}</StyledKind>
            ))}
            {hover ? (
                <Light title={createLocaleDate(localeDate, { locale })}>
                    <StyledTimeValue>{timeValue}</StyledTimeValue>
                </Light>
            ) : (
                <StyledTimeValue>{timeValue}</StyledTimeValue>
            )}
        </StyledRelativeTime>
    );
};
