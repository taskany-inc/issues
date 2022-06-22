import styled from 'styled-components';
import { useTranslations } from 'next-intl';

import { gapS, gapXs, gray8 } from '../design/@generated/themes';

import { Text } from './Text';
import { Dot } from './Dot';
import { RelativeTime } from './RelativeTime';

interface IssueStatsProps {
    state?: React.ReactNode;
    updatedAt: string;
    comments: number;
}

const StyledIssueStats = styled.div`
    padding-top: ${gapS};
`;

const StyledIssueInfo = styled.span`
    padding-left: ${gapXs};
`;

export const IssueStats: React.FC<IssueStatsProps> = ({ state, updatedAt, comments }) => {
    const t = useTranslations('IssueStats');

    return (
        <StyledIssueStats>
            {state ? (
                <>
                    {state}
                    <Text as="span" size="m" color={gray8}>
                        <StyledIssueInfo>
                            <Dot /> <RelativeTime kind="updated" date={updatedAt} /> <Dot /> <b>{comments}</b>{' '}
                            {t('comments')}
                        </StyledIssueInfo>
                    </Text>
                </>
            ) : (
                <Text as="span" size="m" color={gray8}>
                    <RelativeTime kind="Updated" date={updatedAt} /> <Dot /> <b>{comments}</b> {t('comments')}
                </Text>
            )}
        </StyledIssueStats>
    );
};
