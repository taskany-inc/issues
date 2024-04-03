import React from 'react';
import { nullable } from '@taskany/bricks';
import { Badge } from '@taskany/bricks/harmony';

import { NextLink } from './NextLink';
import { StateDot } from './StateDot/StateDot';

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
            iconLeft={<StateDot view="stroke" hue={color} size="s" />}
            iconRight={children}
            text={nullable(
                href,
                (h) => (
                    <NextLink href={h} view="secondary" onClick={onClick}>
                        {title}
                    </NextLink>
                ),
                title,
            )}
            action="dynamic"
            {...attrs}
        />
    );
};
