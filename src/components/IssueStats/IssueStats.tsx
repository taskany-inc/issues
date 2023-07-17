import { useMemo } from 'react';
import styled from 'styled-components';
import { gapXs, gray8 } from '@taskany/colors';
import { Dot, Text, Link, nullable, CircleProgressBar } from '@taskany/bricks';

import { pluralize } from '../../utils/pluralize';
import { formatEstimate } from '../../utils/dateTime';
import { useLocale } from '../../hooks/useLocale';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { getPriorityText } from '../PriorityText/PriorityText';
import { UserGroup } from '../UserGroup';
import { RelativeTime } from '../RelativeTime/RelativeTime';

import { tr } from './IssueStats.i18n';

interface IssueStatsProps {
    updatedAt: Date;
    comments: number;
    owner?: ActivityByIdReturnType | null;
    issuer?: ActivityByIdReturnType | null;
    estimate?: { date: string; q?: string; y: string };
    priority?: string | null;
    achivedCriteriaWeight?: number | null;
    mode?: 'compact' | 'default';
    onCommentsClick?: () => void;
}

const StyledIssueStats = styled(Text)<Pick<IssueStatsProps, 'mode'>>`
    ${({ mode }) =>
        mode === 'default' &&
        `
            padding-left: ${gapXs};
        `}
`;

const StyledDotSep = styled.span`
    display: inline-block;
    vertical-align: middle;
`;

const StyledCircleProgressBar = styled(CircleProgressBar)`
    vertical-align: middle;
`;

const StyledUserGroupContainer = styled.span`
    display: inline-block;
    vertical-align: middle;
`;

const DotSep: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <StyledDotSep>
        <Dot /> {children}
    </StyledDotSep>
);

export const IssueStats: React.FC<IssueStatsProps> = ({
    issuer,
    owner,
    estimate,
    priority,
    comments,
    achivedCriteriaWeight,
    updatedAt,
    mode,
    onCommentsClick,
}) => {
    const locale = useLocale();

    const issuers = useMemo(() => {
        if (issuer && owner && owner.id === issuer.id) {
            return [owner];
        }

        return [issuer, owner].filter(Boolean) as NonNullable<ActivityByIdReturnType>[];
    }, [issuer, owner]);

    return (
        <StyledIssueStats mode={mode} as="span" size="m" color={gray8}>
            {nullable(issuers.length, () => (
                <DotSep>
                    <StyledUserGroupContainer>
                        <UserGroup users={issuers} />
                    </StyledUserGroupContainer>
                </DotSep>
            ))}
            {nullable(estimate, (e) => (
                <DotSep>{formatEstimate(e, locale)}</DotSep>
            ))}
            {nullable(priority, (p) => (
                <DotSep>{getPriorityText(p)}</DotSep>
            ))}
            {achivedCriteriaWeight != null && (
                <DotSep>
                    <StyledCircleProgressBar value={achivedCriteriaWeight} />
                </DotSep>
            )}
            <DotSep>
                <RelativeTime key={Date.now()} kind={mode === 'compact' ? undefined : 'updated'} date={updatedAt} />
            </DotSep>
            {nullable(comments, () => (
                <DotSep>
                    <Link inline onClick={onCommentsClick}>
                        <b>{comments}</b>{' '}
                        {pluralize({
                            locale,
                            count: comments,
                            one: tr('one'),
                            few: tr('few'),
                            many: tr('many'),
                        })}
                    </Link>
                </DotSep>
            ))}
        </StyledIssueStats>
    );
};
