import { useMemo } from 'react';
import styled from 'styled-components';
import { gapXs, gray8 } from '@taskany/colors';
import { Dot, Text, Link, nullable, CircleProgressBar } from '@taskany/bricks';
import { IconMessageOutline } from '@taskany/icons';

import { formateEstimate } from '../../utils/dateTime';
import { DateType } from '../../types/date';
import { useLocale } from '../../hooks/useLocale';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { getPriorityText } from '../PriorityText/PriorityText';
import { UserGroup } from '../UserGroup';
import { RelativeTime } from '../RelativeTime/RelativeTime';

interface IssueStatsProps {
    updatedAt: Date;
    comments: number;
    owner?: ActivityByIdReturnType | null;
    issuer?: ActivityByIdReturnType | null;
    estimate?: Date | null;
    estimateType?: DateType | null;
    priority?: string | null;
    achivedCriteriaWeight?: number | null;
    mode?: 'compact' | 'default';
    onCommentsClick?: () => void;
}

const StyledIssueStats = styled(Text)<Pick<IssueStatsProps, 'mode'>>`
    display: flex;
    align-items: center;

    ${({ mode }) =>
        mode === 'default' &&
        `
            padding-left: ${gapXs};
        `}
`;

const StyledDotSep = styled.span`
    display: flex;
    align-items: center;
`;

const CommentsCountIcon = styled(IconMessageOutline)`
    display: inline-block;
    vertical-align: middle;
`;

const DotSep: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <StyledDotSep>
        <Dot />
        {children}
    </StyledDotSep>
);

export const IssueStats: React.FC<IssueStatsProps> = ({
    issuer,
    owner,
    estimate,
    estimateType,
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
                    <UserGroup users={issuers} />
                </DotSep>
            ))}

            {nullable(estimate, (e) => (
                <DotSep>
                    {formateEstimate(e, {
                        type: estimateType ?? 'Strict',
                        locale,
                    })}
                </DotSep>
            ))}

            {nullable(priority, (p) => (
                <DotSep>{getPriorityText(p)}</DotSep>
            ))}

            {achivedCriteriaWeight != null && (
                <DotSep>
                    <CircleProgressBar value={achivedCriteriaWeight} />
                </DotSep>
            )}

            <DotSep>
                <RelativeTime kind={mode === 'compact' ? undefined : 'updated'} date={updatedAt} />
            </DotSep>

            {nullable(comments, () => (
                <DotSep>
                    <Link inline onClick={onCommentsClick}>
                        <CommentsCountIcon size="s" /> {comments}
                    </Link>
                </DotSep>
            ))}
        </StyledIssueStats>
    );
};
