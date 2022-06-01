/* eslint-disable react/display-name */
import React from 'react';
import dynamic from 'next/dynamic';

import { textColorPrimary } from '../design/@generated/themes';

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
    arrowDownSmall: dynamic(() => import('teenyicons/outline/down-small.svg')),
    clipboardPlus: dynamic(() => import('teenyicons/outline/clipboard-plus.svg')),
    clipboardTick: dynamic(() => import('teenyicons/outline/clipboard-tick.svg')),
    calendarTick: dynamic(() => import('teenyicons/outline/calendar-tick.svg')),
    calendar: dynamic(() => import('teenyicons/outline/calendar.svg')),
    flow: dynamic(() => import('teenyicons/outline/git-compare.svg')),
    tag: dynamic(() => import('teenyicons/outline/tag.svg')),
    search: dynamic(() => import('teenyicons/outline/search.svg')),
};

const sizesMap = {
    xs: 14,
    s: 16,
    m: 32,
    l: 48,
};

interface IconProps {
    type: keyof typeof componentsMap;
    size: keyof typeof sizesMap;
    color?: string;
    stroke?: number;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
    ({ type, size, color = textColorPrimary, stroke = 1, className, onClick }, ref) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Component: React.ComponentType<any> = componentsMap[type];
        const sizePx = `${sizesMap[size]}px`;

        return (
            <span ref={ref} className={className} style={{ lineHeight: 'initial' }} onClick={onClick}>
                <Component width={sizePx} height={sizePx} color={color} strokeWidth={stroke} />
            </span>
        );
    },
);
