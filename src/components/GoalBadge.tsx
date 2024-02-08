import React from 'react';
import { Link, nullable } from '@taskany/bricks';
import { Dot } from '@taskany/bricks/harmony';

import { Badge } from './Badge';
import { NextLink } from './NextLink';

interface GoalBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'> {
    title: string;
    href?: string;
    color?: string;
    children?: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export const GoalBadge: React.FC<GoalBadgeProps> = ({ href, title, color, children, className, onClick, ...attrs }) => {
    return (
        <Badge
            className={className}
            icon={<Dot color={color} size="s" />}
            text={nullable(
                href,
                () => (
                    <Link as={NextLink} href={href} inline onClick={onClick}>
                        {title}
                    </Link>
                ),
                title,
            )}
            action={children}
            {...attrs}
        />
    );
};
