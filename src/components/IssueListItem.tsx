import styled from 'styled-components';
import NextLink from 'next/link';
import { gapM, gapS, gapXs } from '@taskany/colors';
import { Text, Link } from '@taskany/bricks';

import { routes } from '../hooks/router';

import { StateDot } from './StateDot';

interface IssueListItemProps {
    issue: {
        id: string;
        title: string;
        state?: {
            title: string;
            hue: number;
        };
    };
}

const StyledIssueListItem = styled.div`
    padding: ${gapS} ${gapM} ${gapS} 0;
    display: flex;
    align-items: top;
`;

const StyledIssueListItemTitle = styled(Text)`
    padding-top: 0;
    margin-top: 0;
    padding-left: ${gapS};
`;

const StyledLink = styled(Link)`
    display: inline-block;
`;

const StyledDotWrapper = styled.div`
    padding-top: ${gapXs};
`;

export const IssueListItem: React.FC<IssueListItemProps> = ({ issue }) => {
    return (
        <NextLink passHref href={routes.goal(issue.id)}>
            <StyledLink inline>
                <StyledIssueListItem>
                    <StyledDotWrapper>
                        <StateDot {...issue.state} />
                    </StyledDotWrapper>
                    <StyledIssueListItemTitle size="s" weight="bold" color="inherit">
                        {issue.title}
                    </StyledIssueListItemTitle>
                </StyledIssueListItem>
            </StyledLink>
        </NextLink>
    );
};
