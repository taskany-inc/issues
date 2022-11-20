import styled, { css } from 'styled-components';

import { gapXs, gray4, gray7, gray8, radiusM } from '../design/@generated/themes';

import { IssueKey } from './IssueKey';
import { Text } from './Text';

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

    border: 1px solid ${gray7};
    border-radius: ${radiusM};

    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        border-color: ${gray8};
        background-color: ${gray4};
    }

    ${({ focused }) =>
        focused &&
        css`
            border-color: ${gray8};
            background-color: ${gray4};
        `}
`;

const StyledGoalMenuItemTitleText = styled(Text)`
    padding-top: ${gapXs};
`;

export const GoalMenuItem: React.FC<GoalMenuItemProps> = ({ id, title, focused, onClick }) => (
    <StyledGoalMenuItem onClick={onClick} focused={focused}>
        <IssueKey id={id} size="xs" />
        <StyledGoalMenuItemTitleText size="m" weight="bold">
            {title}
        </StyledGoalMenuItemTitleText>
    </StyledGoalMenuItem>
);
