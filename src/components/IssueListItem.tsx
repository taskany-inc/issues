import styled from 'styled-components';
import NextLink from 'next/link';
import { Text, Link, nullable } from '@taskany/bricks';

import { routes } from '../hooks/router';

import { StateDot } from './StateDot/StateDot';

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
    strike?: boolean;
    className?: string;
}

const StyledIssueListItem = styled.div`
    padding: var(--gap-s) var(--gap-m) var(--gap-s) 0;
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
    padding-top: var(--gap-xs);
    padding-right: ${({ size }) => (size === 'xs' ? 'var(--gap-xs)' : 'var(--gap-s)')};
`;

export const IssueListItem: React.FC<IssueListItemProps> = ({ issue, className, size = 's', strike }) => {
    return (
        <NextLink passHref href={routes.goal(issue._shortId)} legacyBehavior>
            <StyledLink inline>
                <StyledIssueListItem className={className}>
                    {nullable(issue.state, (state) => (
                        <StyledDotWrapper size={size}>
                            <StateDot title={state.title} hue={state.hue} size={size !== 'xs' ? 'm' : 's'} />
                        </StyledDotWrapper>
                    ))}
                    <StyledIssueListItemTitle size={size} weight="bold" color="inherit" strike={strike}>
                        {issue.title}
                    </StyledIssueListItemTitle>
                </StyledIssueListItem>
            </StyledLink>
        </NextLink>
    );
};
