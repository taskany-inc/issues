import React from 'react';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { IconChatTypingAltOutline } from '@taskany/icons';
import { gapXs, gray9 } from '@taskany/colors';

export interface CommentsCountBadgeProps {
    count: number;
    color?: React.ComponentProps<typeof Text>['color'];
}

const StyledCommentsCountBadge = styled.span`
    display: flex;
    align-items: center;
`;

const CommentsCount = styled(Text)`
    display: flex;

    padding-left: ${gapXs};
`;

const StyledIconChatTypingAltOutline = styled(IconChatTypingAltOutline)`
    display: flex;
`;

export const CommentsCountBadge: React.FC<CommentsCountBadgeProps> = ({ count, color = gray9 }) => {
    return (
        <StyledCommentsCountBadge>
            <StyledIconChatTypingAltOutline size="xs" color={color} />
            <CommentsCount as="span" size="s" color={color}>
                {count}
            </CommentsCount>
        </StyledCommentsCountBadge>
    );
};
