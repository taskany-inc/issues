import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { gapXs, gray8 } from '@taskany/colors';
import { Dot, Text, Link, nullable, CircleProgressBar } from '@taskany/bricks';

import { pluralize } from '../../utils/pluralize';
import { formatEstimate } from '../../utils/dateTime';
import { usePageContext } from '../../hooks/usePageContext';
import { getPriorityText } from '../PriorityText/PriorityText';

import { tr } from './IssueStats.i18n';

const RelativeTime = dynamic(() => import('../RelativeTime/RelativeTime'));

interface IssueStatsProps {
    updatedAt: Date;
    comments: number;
    estimate?: { date: string; q?: string; y: string };
    priority?: string | null;
    achivedCriteriaWeight?: number;
    mode?: 'compact' | 'default';
    onCommentsClick?: () => void;
}

const StyledIssueInfo = styled(Text)`
    padding-left: ${gapXs};
`;

const StyledDotSep = styled.span`
    display: inline-block;
    vertical-align: middle;
`;

const DotSep: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <StyledDotSep>
        <Dot /> {children}
    </StyledDotSep>
);

export const IssueStats: React.FC<IssueStatsProps> = ({
    estimate,
    priority,
    comments,
    achivedCriteriaWeight,
    updatedAt,
    mode,
    onCommentsClick,
}) => {
    const { locale } = usePageContext();

    return (
        <StyledIssueInfo as="span" size="m" color={gray8}>
            {nullable(estimate, (e) => (
                <DotSep>{formatEstimate(e, locale)}</DotSep>
            ))}
            {nullable(priority, (p) => (
                <DotSep>{getPriorityText(p)}</DotSep>
            ))}
            {achivedCriteriaWeight !== undefined && (
                <DotSep>
                    <StyledDotSep>
                        <CircleProgressBar value={achivedCriteriaWeight} />
                    </StyledDotSep>
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
        </StyledIssueInfo>
    );
};
