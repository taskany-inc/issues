import React from 'react';
import dynamic from 'next/dynamic';
import styled, { css } from 'styled-components';

const componentsMap = {
    plus: dynamic(() => import('teenyicons/outline/plus-circle.svg')),
    user: dynamic(() => import('teenyicons/outline/user.svg')),
    sun: dynamic(() => import('teenyicons/outline/sun.svg')),
    moon: dynamic(() => import('teenyicons/outline/moon.svg')),
    cross: dynamic(() => import('teenyicons/outline/x.svg')),
    elbowСonnector: dynamic(() => import('teenyicons/outline/elbow-connector.svg')),
    bookmark: dynamic(() => import('teenyicons/outline/bookmark.svg')),
    building: dynamic(() => import('teenyicons/outline/building.svg')),
    bulbOn: dynamic(() => import('teenyicons/outline/bulb-on.svg')),
    cog: dynamic(() => import('teenyicons/outline/cog.svg')),
    wand: dynamic(() => import('teenyicons/outline/wand.svg')),
    location: dynamic(() => import('teenyicons/outline/location.svg')),
    arrowDownSmall: dynamic(() => import('teenyicons/solid/down-small.svg')),
    arrowUpSmall: dynamic(() => import('teenyicons/solid/up-small.svg')),
    clipboardPlus: dynamic(() => import('teenyicons/outline/clipboard-plus.svg')),
    clipboardTick: dynamic(() => import('teenyicons/outline/clipboard-tick.svg')),
    calendarTick: dynamic(() => import('teenyicons/outline/calendar-tick.svg')),
    calendar: dynamic(() => import('teenyicons/outline/calendar.svg')),
    flow: dynamic(() => import('teenyicons/outline/git-compare.svg')),
    tag: dynamic(() => import('teenyicons/outline/tag.svg')),
    search: dynamic(() => import('teenyicons/outline/search.svg')),
    gitFork: dynamic(() => import('teenyicons/outline/git-fork.svg')),
    message: dynamic(() => import('teenyicons/outline/message.svg')),
    eye: dynamic(() => import('teenyicons/outline/eye.svg')),
    eyeClosed: dynamic(() => import('teenyicons/outline/eye-closed.svg')),
    star: dynamic(() => import('teenyicons/outline/star.svg')),
    starFilled: dynamic(() => import('teenyicons/solid/star.svg')),
    emoji: dynamic(() => import('teenyicons/outline/mood-tongue.svg')),
    markdown: dynamic(() => import('teenyicons/outline/markdown.svg')),
    question: dynamic(() => import('teenyicons/outline/question-circle.svg')),
    editCircle: dynamic(() => import('teenyicons/outline/edit-circle.svg')),
};

export const sizesMap = {
    xs: 14,
    s: 15,
    m: 32,
    l: 48,
};

interface IconProps {
    type: keyof typeof componentsMap;
    size: keyof typeof sizesMap | number;
    color?: string;
    stroke?: number;
    className?: string;
    noWrap?: boolean;

    onClick?: (e: React.MouseEvent) => void;
}

const StyledIcon = styled.span<{ onClick?: IconProps['onClick'] }>`
    ${({ onClick }) =>
        onClick &&
        css`
            cursor: pointer;
        `}
`;

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
    ({ type, size, color = 'inherit', stroke = 1, className, onClick, noWrap }, ref) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Component: React.ComponentType<any> = componentsMap[type];
        const sizePx = `${typeof size === 'string' ? sizesMap[size] : size}px`;
        const content = (
            <Component
                width={sizePx}
                height={sizePx}
                color={color}
                strokeWidth={stroke}
                onClick={onClick}
                style={{
                    cursor: onClick ? 'pointer' : 'default',
                }}
            />
        );

        return noWrap ? (
            content
        ) : (
            <StyledIcon ref={ref} className={className} style={{ lineHeight: 'initial' }} onClick={onClick}>
                {content}
            </StyledIcon>
        );
    },
);
