import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { HTMLAttributes } from 'react';

import { comboboxItem } from '../utils/domObjects';

interface ProjectMenuItemProps {
    title?: string;
    focused?: boolean;

    onClick?: () => void;
}

const StyledProjectCard = styled.div<{ focused?: boolean }>`
    box-sizing: border-box;
    padding: var(--gap-xs) var(--gap-s);
    margin-bottom: var(--gap-s);
    min-width: 200px;

    border-radius: var(--radius-m);

    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        background-color: var(--gray4);
    }

    ${({ focused }) =>
        focused &&
        `
            background-color: var(--gray4);
        `}
`;

export const ProjectMenuItem: React.FC<ProjectMenuItemProps & HTMLAttributes<HTMLDivElement>> = ({
    title,
    focused,
    onClick,
    ...rest
}) => (
    <StyledProjectCard onClick={onClick} focused={focused} {...rest} {...comboboxItem.attr}>
        <Text size="s" weight="bold">
            {title}
        </Text>
    </StyledProjectCard>
);
