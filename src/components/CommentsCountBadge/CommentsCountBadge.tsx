import React from 'react';
import { Text } from '@taskany/bricks/harmony';
import { IconChatTypingAltOutline } from '@taskany/icons';

import s from './CommentsCountBadge.module.css';

export interface CommentsCountBadgeProps {
    count: number;
}

export const CommentsCountBadge: React.FC<CommentsCountBadgeProps> = ({ count }) => {
    return (
        <span className={s.CommentsCountBadge}>
            <IconChatTypingAltOutline size="xs" className={s.CommentsCountBadge} />
            <Text as="span" size="s">
                {count}
            </Text>
        </span>
    );
};
