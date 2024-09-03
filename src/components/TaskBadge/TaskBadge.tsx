import React from 'react';
import { nullable } from '@taskany/bricks';
import { Badge, Text, Tooltip } from '@taskany/bricks/harmony';
import { BaseIcon } from '@taskany/icons';

import { NextLink } from '../NextLink';

import styles from './TaskBadge.module.css';

interface TaskBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'title'> {
    title: React.ReactNode;
    href?: string;
    type?: {
        src: string;
        title: string;
    };
    state?: {
        title: string; // ex. "Backlog"
        color?: string | null; // ex. "blue-gray"
    } | null;
    strike?: boolean;
    children?: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    project?: string;
}

export const TaskBadgeIcon: React.FC<{ src: string }> = ({ src }) => (
    <BaseIcon
        className={styles.TaskBadgeType}
        size="s"
        value={(props) => (
            <svg {...props}>
                <image href={src} width={16} height={16} />
            </svg>
        )}
    />
);

export const TaskBadgeState: React.FC<{ state: string; color?: string | null }> = ({ state, color }) => {
    const style = color ? ({ '--task-badge-color': color.split('-')[0] } as React.CSSProperties) : {};
    return (
        <Tooltip
            placement="top"
            target={
                <span style={style} className={styles.TaskBadgeState}>
                    <Text size="xs" as="span" className={styles.TaskBadgeStateSymbol}>
                        {state.slice(0, 1).toUpperCase()}
                    </Text>
                </span>
            }
        >
            {state}
        </Tooltip>
    );
};

export const TaskBadge: React.FC<TaskBadgeProps> = ({
    href,
    title,
    children,
    className,
    onClick,
    type,
    state,
    project,
    ...attrs
}) => {
    return (
        <Badge
            className={className}
            iconLeft={nullable(
                type?.src,
                (src) => (
                    <TaskBadgeIcon src={src} />
                ),
                nullable(state, (s) => <TaskBadgeState state={s.title} color={s.color} />),
            )}
            iconRight={children}
            text={nullable(
                href,
                (h) => (
                    <NextLink href={h} target="_blank" view="secondary" onClick={onClick}>
                        {title}
                        {nullable(project, (p) => (
                            <>
                                <Text className={styles.TaskBadgeProjectName} as="span" color="var(--gray8)">
                                    ({p})
                                </Text>
                            </>
                        ))}
                    </NextLink>
                ),
                <>
                    {title}
                    {nullable(project, (p) => (
                        <>
                            <Text className={styles.TaskBadgeProjectName} as="span" color="var(--gray8)">
                                ({p})
                            </Text>
                        </>
                    ))}
                </>,
            )}
            action="dynamic"
            {...attrs}
        />
    );
};
