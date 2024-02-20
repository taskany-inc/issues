import styled from 'styled-components';
import { Text } from '@taskany/bricks';

import { IssueKey } from './IssueKey';

interface GoalMenuItemProps {
    id: string;
    title?: string;
    project?: boolean;
    focused?: boolean;

    onClick?: () => void;
}

const StyledGoalMenuItem = styled.div<{ focused?: boolean }>`
    box-sizing: border-box;
    justify-content: center;
    align-items: center;
    min-width: 250px;

    padding: 6px;
    margin-bottom: 4px;

    border: 1px solid var(--gray7);
    border-radius: var(--radius-m);

    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        border-color: var(--gray8);
        background-color: var(--gray4);
    }

    ${({ focused }) =>
        focused &&
        `
            border-color: var(--gray8);
            background-color: var(--gray4);
        `}
`;

const StyledGoalMenuItemTitleText = styled(Text)`
    padding-top: var(--gap-xs);
`;

export const GoalMenuItem: React.FC<GoalMenuItemProps> = ({ id, title, focused, onClick }) => (
    <StyledGoalMenuItem onClick={onClick} focused={focused}>
        <IssueKey id={id} size="xs" />
        <StyledGoalMenuItemTitleText size="m" weight="bold">
            {title}
        </StyledGoalMenuItemTitleText>
    </StyledGoalMenuItem>
);
