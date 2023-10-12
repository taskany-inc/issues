import React from 'react';
import styled from 'styled-components';
import { Text, nullable } from '@taskany/bricks';
import { gapS, gapXs, gray8, gray9 } from '@taskany/colors';

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

const StyledBadge = styled.span`
    position: relative;
    display: flex;
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
`;

export const Badge: React.FC<BadgeProps> = ({ icon, text, action, className }) => {
    return (
        <StyledBadge className={className}>
            {icon}

            <StyledText>{text}</StyledText>

            {nullable(action, (act) => (
                <StyledBadgeIconContainer>{act}</StyledBadgeIconContainer>
            ))}
        </StyledBadge>
    );
};
