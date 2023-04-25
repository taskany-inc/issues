import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { gapXs, gray8 } from '@taskany/colors';
import { Dot, Text, Link, nullable } from '@taskany/bricks';

import { pluralize } from '../../utils/pluralize';
import { usePageContext } from '../../hooks/usePageContext';

import { tr } from './IssueStats.i18n';

const RelativeTime = dynamic(() => import('../RelativeTime/RelativeTime'));

interface IssueStatsProps {
    updatedAt: string;
    comments: number;
    mode?: 'compact' | 'default';
    onCommentsClick?: () => void;
}

const StyledIssueInfo = styled.span`
    padding-left: ${gapXs};
`;

export const IssueStats: React.FC<IssueStatsProps> = ({ comments, updatedAt, mode, onCommentsClick }) => {
    const { locale } = usePageContext();

    return (
        <Text as="span" size="m" color={gray8}>
            <StyledIssueInfo>
                <Dot /> <RelativeTime kind={mode === 'compact' ? undefined : 'updated'} date={updatedAt} />
                {nullable(comments, () => (
                    <>
                        <Dot />{' '}
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
                    </>
                ))}
            </StyledIssueInfo>
        </Text>
    );
};
