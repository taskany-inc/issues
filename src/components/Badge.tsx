import styled, { css } from 'styled-components';

import { gray7, gray9, radiusL } from '../design/@generated/themes';

interface BadgeProps {
    size?: 's' | 'm';
}

const StyledBadge = styled.div<{ size: BadgeProps['size'] }>`
    box-sizing: border-box;

    background-color: ${gray7};

    border-radius: ${radiusL};

    color: ${gray9};
    font-size: 12px;

    ${({ size }) =>
        size === 's' &&
        css`
            padding: 1px 4px;
        `}

    ${({ size }) =>
        size === 'm' &&
        css`
            padding: 2px 8px;
        `}
`;

export const Badge: React.FC<BadgeProps> = ({ size = 's', children }) => (
    <StyledBadge size={size}>{children}</StyledBadge>
);
