import React from 'react';
import styled from 'styled-components';
import { Text, nullable } from '@taskany/bricks';
import { gapM, gapS, gapXs, gray8, gray9 } from '@taskany/colors';

interface BadgeProps {
    icon: React.ReactNode;
    text: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

const StyledBadgeIconContainer = styled.span`
    display: flex;
    align-items: center;

    visibility: hidden;

    color: ${gray8};

    &:hover {
        color: ${gray9};
    }
`;

/**
 * First row has height equal to the height of the first text line.
 * If the content (like icons) is larger than the first text line, then it expands the first row.
 * Suitable for text sizes 'xs', 's', 'm', 'l'.
 */
const StyledBadge = styled.span`
    position: relative;
    display: grid;
    grid-template-columns: min-content auto min-content;
    grid-template-rows: minmax(max-content, calc(${gapM} + ${gapXs})) minmax(0, 1fr);
    align-items: center;

    padding: ${gapXs} 0;

    width: fit-content;

    &:hover {
        ${StyledBadgeIconContainer} {
            visibility: visible;

            cursor: pointer;
        }
    }
`;

const StyledText = styled(Text).attrs({
    color: gray9,
    size: 's',
    ellipsis: true,
})`
    padding: 0 ${gapXs} 0 ${gapS};
    grid-row: span 2;
`;

export const Badge: React.FC<BadgeProps> = ({ icon, text, action, className, ...attrs }) => {
    return (
        <StyledBadge className={className} {...attrs}>
            {icon}

            <StyledText>{text}</StyledText>

            {nullable(action, (act) => (
                <StyledBadgeIconContainer>{act}</StyledBadgeIconContainer>
            ))}
        </StyledBadge>
    );
};
