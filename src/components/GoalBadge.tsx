import React from 'react';
import { Link, nullable } from '@taskany/bricks';

import { Badge } from './Badge';
import { NextLink } from './NextLink';
import { StateDot } from './StateDot';

interface GoalBadgeProps {
    title: string;
    href?: string;
    state?: {
        title?: string;
        hue?: number;
    } | null;
    children?: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const GoalBadge: React.FC<GoalBadgeProps> = ({ href, title, state, children, className, onClick }) => {
    return (
        <Badge
            className={className}
            icon={<StateDot title={state?.title} hue={state?.hue} />}
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
        />
    );
};
