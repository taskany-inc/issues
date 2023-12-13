import React from 'react';
import { Link, nullable } from '@taskany/bricks';
import { IconTargetOutline } from '@taskany/icons';
import colorLayer from 'color-layer';

import { Badge } from './Badge';
import { NextLink } from './NextLink';

interface GoalBadgeProps {
    title: string;
    href?: string;
    color?: number;
    theme: number;
    children?: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export const GoalBadge: React.FC<GoalBadgeProps> = ({
    href,
    title,
    color = 1,
    theme,
    children,
    className,
    onClick,
    ...attrs
}) => {
    const sat = color === 1 ? 0 : undefined;
    return (
        <Badge
            className={className}
            icon={<IconTargetOutline size="s" color={colorLayer(color, 10, sat)[theme]} />}
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
