import styled from 'styled-components';
import NextLink from 'next/link';
import { gapM, gapS, gapXs } from '@taskany/colors';
import { Text, Link } from '@taskany/bricks';

import { routes } from '../hooks/router';

import { StateDot } from './StateDot';

interface IssueListItemProps {
    issue: {
        id: string;
        _shortId: string;
        title: string;
        state?: {
            title: string;
            hue: number;
        } | null;
    };
    size?: React.ComponentProps<typeof Text>['size'];
    className?: string;
}

const StyledIssueListItem = styled.div`
    padding: ${gapS} ${gapM} ${gapS} 0;
    display: flex;
    align-items: top;
`;

const StyledIssueListItemTitle = styled(Text)<{ size: IssueListItemProps['size'] }>`
    padding-top: 0;
    margin-top: 0;
    padding-left: ${({ size }) => (size === 'xs' ? gapXs : gapS)};
`;

const StyledLink = styled(Link)`
    display: inline-block;
`;

const StyledDotWrapper = styled.div`
    padding-top: ${gapXs};
`;

export const IssueListItem: React.FC<IssueListItemProps> = ({ issue, className, size = 's' }) => {
    return (
        <NextLink passHref href={routes.goal(issue._shortId)}>
            <StyledLink inline>
                <StyledIssueListItem className={className}>
                    <StyledDotWrapper>
                        <StateDot {...issue.state} size={size !== 'xs' ? 'm' : 's'} />
                    </StyledDotWrapper>
                    <StyledIssueListItemTitle size={size} weight="bold" color="inherit">
                        {issue.title}
                    </StyledIssueListItemTitle>
                </StyledIssueListItem>
            </StyledLink>
        </NextLink>
    );
};
