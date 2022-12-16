import styled from 'styled-components';

import { gapS, gapXs, gray4, radiusM } from '../design/@generated/themes';

import { Text } from './Text';

interface ProjectMenuItemProps {
    title?: string;
    focused?: boolean;

    onClick?: () => void;
}

const StyledProjectCard = styled.div<{ focused?: boolean }>`
    box-sizing: border-box;
    padding: ${gapXs} ${gapS};
    margin-bottom: ${gapS};
    min-width: 200px;

    border-radius: ${radiusM};

    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        background-color: ${gray4};
    }

    ${({ focused }) =>
        focused &&
        `
            background-color: ${gray4};
        `}
`;

export const ProjectMenuItem: React.FC<ProjectMenuItemProps> = ({ title, focused, onClick }) => (
    <StyledProjectCard onClick={onClick} focused={focused}>
        <Text size="s" weight="bold">
            {title}
        </Text>
    </StyledProjectCard>
);
