import React from 'react';
import { nullable } from '@taskany/bricks';

import { Badge } from './Badge';
import { NextLink } from './NextLink';
import { StateDot } from './StateDot';

interface GoalBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'title'> {
    title: React.ReactNode;
    href?: string;
    color?: number;
    children?: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export const GoalBadge: React.FC<GoalBadgeProps> = ({
    href,
    title,
    color = 1,
    children,
    className,
    onClick,
    ...attrs
}) => {
    return (
        <Badge
            className={className}
            icon={<StateDot view="stroke" hue={color} size="s" />}
            text={nullable(
                href,
                (h) => (
                    <NextLink href={h} view="inline" onClick={onClick}>
                        {title}
                    </NextLink>
                ),
                title,
            )}
            action={children}
            {...attrs}
        />
    );
};
