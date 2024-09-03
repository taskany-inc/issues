import React, { ComponentProps } from 'react';
import { nullable } from '@taskany/bricks';
import { Badge, CircleProgressBar } from '@taskany/bricks/harmony';

import { NextLink } from './NextLink';
import { StateDot } from './StateDot/StateDot';

interface GoalBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'title'> {
    title: React.ReactNode;
    href?: string;
    state: ComponentProps<typeof StateDot>['state'];
    strike?: boolean;
    children?: React.ReactNode;
    className?: string;
    progress?: number | null;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export const GoalBadge: React.FC<GoalBadgeProps> = ({
    href,
    title,
    children,
    className,
    onClick,
    state,
    progress,
    ...attrs
}) => {
    return (
        <Badge
            className={className}
            iconLeft={nullable(
                progress,
                (value) => (
                    <CircleProgressBar value={value} size="xs" />
                ),
                nullable(state, (s) => <StateDot view="stroke" state={s} size="l" />),
            )}
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
