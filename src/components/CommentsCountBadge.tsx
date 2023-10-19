import React from 'react';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { IconChatTypingAltOutline } from '@taskany/icons';
import { gapXs } from '@taskany/colors';

export interface CommentsCountBadgeProps {
    count: number;
}

const StyledCommentsCountBadge = styled.span`
    display: flex;
    align-items: center;
    gap: ${gapXs};
`;

const StyledIconChatTypingAltOutline = styled(IconChatTypingAltOutline)`
    display: flex;
`;

export const CommentsCountBadge: React.FC<CommentsCountBadgeProps> = ({ count }) => {
    return (
        <StyledCommentsCountBadge>
            <StyledIconChatTypingAltOutline size="xs" />
            <Text as="span" size="s" color="inherit">
                {count}
            </Text>
        </StyledCommentsCountBadge>
    );
};
