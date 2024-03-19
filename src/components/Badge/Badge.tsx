import React from 'react';
import { nullable } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';
import cn from 'classnames';

import s from './Badge.module.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    icon: React.ReactNode;
    text: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ icon, text, action, className, ...attrs }) => {
    return (
        <span className={cn(s.Badge, className)} {...attrs}>
            {icon}

            <Text size="s" ellipsis className={s.BadgeText}>
                {text}
            </Text>

            {nullable(action, (act) => (
                <span className={s.BadgeIconContainer}>{act}</span>
            ))}
        </span>
    );
};
