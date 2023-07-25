import styled from 'styled-components';
import NextLink from 'next/link';
import { gapM, gapS, gapXs } from '@taskany/colors';
import { Text, Link, nullable } from '@taskany/bricks';

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

const StyledIssueListItemTitle = styled(Text)`
    padding-top: 0;
    margin-top: 0;
`;

const StyledLink = styled(Link)`
    display: inline-block;
`;

const StyledDotWrapper = styled.div<{ size: IssueListItemProps['size'] }>`
    padding-top: ${gapXs};
    padding-right: ${({ size }) => (size === 'xs' ? gapXs : gapS)};
`;

export const IssueListItem: React.FC<IssueListItemProps> = ({ issue, className, size = 's' }) => {
    return (
        <NextLink passHref href={routes.goal(issue._shortId)} legacyBehavior>
            <StyledLink inline>
                <StyledIssueListItem className={className}>
                    {nullable(issue.state, (state) => (
                        <StyledDotWrapper size={size}>
                            <StateDot {...state} size={size !== 'xs' ? 'm' : 's'} />
                        </StyledDotWrapper>
                    ))}
                    <StyledIssueListItemTitle size={size} weight="bold" color="inherit">
                        {issue.title}
                    </StyledIssueListItemTitle>
                </StyledIssueListItem>
            </StyledLink>
        </NextLink>
    );
};
