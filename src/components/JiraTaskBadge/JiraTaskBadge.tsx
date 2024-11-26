import React from 'react';
import { nullable } from '@taskany/bricks';
import { Badge, Text, Tooltip } from '@taskany/bricks/harmony';
import { BaseIcon } from '@taskany/icons';

import { NextLink } from '../NextLink';

import styles from './JiraTaskBadge.module.css';

interface JiraTaskBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'title'> {
    taskKey: string;
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

export const JiraTaskBadgeIcon: React.FC<{ src: string }> = ({ src }) => (
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

export const JiraTaskBadgeState: React.FC<{ state: string; color?: string | null }> = ({ state, color }) => {
    const style = color ? ({ '--task-badge-color': color.split('-')[0] } as React.CSSProperties) : {};
    return (
        <Tooltip
            placement="top"
            target={
                <span style={style} className={styles.JiraTaskBadgeState}>
                    <Text size="xs" as="span" className={styles.JiraTaskBadgeStateSymbol}>
                        {state.slice(0, 1).toUpperCase()}
                    </Text>
                </span>
            }
        >
            {state}
        </Tooltip>
    );
};

const JiraTaskBadgeLabel: React.FC<Pick<JiraTaskBadgeProps, 'title' | 'taskKey'>> = ({ title, taskKey }) => {
    return (
        <>
            {title}
            {String.fromCharCode(0x0d)}
            <Text as="span" color="var(--gray-500)">
                ({taskKey})
            </Text>
        </>
    );
};

export const JiraTaskBadge: React.FC<JiraTaskBadgeProps> = ({
    href,
    title,
    children,
    className,
    onClick,
    type,
    state,
    taskKey,
    ...attrs
}) => {
    return (
        <Badge
            className={className}
            iconLeft={nullable(
                type?.src,
                (src) => (
                    <JiraTaskBadgeIcon src={src} />
                ),
                nullable(state, (s) => <JiraTaskBadgeState state={s.title} color={s.color} />),
            )}
            iconRight={children}
            text={nullable(
                href,
                (h) => (
                    <NextLink href={h} target="_blank" view="secondary" onClick={onClick}>
                        <JiraTaskBadgeLabel title={title} taskKey={taskKey} />
                    </NextLink>
                ),
                <JiraTaskBadgeLabel title={title} taskKey={taskKey} />,
            )}
            action="dynamic"
            {...attrs}
        />
    );
};
