import styled from 'styled-components';
import NextLink from 'next/link';

import { gapS } from '../design/@generated/themes';
import { routes } from '../hooks/router';

import { StateDot } from './StateDot';
import { Text } from './Text';
import { Link } from './Link';

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
    padding: ${gapS} 0;
    display: flex;
    align-items: center;
`;

const StyledIssueListItemTitle = styled(Text)`
    padding-left: ${gapS};
`;

export const IssueListItem: React.FC<IssueListItemProps> = ({ issue }) => {
    return (
        <NextLink passHref href={routes.goal(issue.id)}>
            <Link inline>
                <StyledIssueListItem>
                    <StateDot {...issue.state} />
                    <StyledIssueListItemTitle size="s" weight="bold" color="inherit">
                        {issue.title}
                    </StyledIssueListItemTitle>
                </StyledIssueListItem>
            </Link>
        </NextLink>
    );
};
