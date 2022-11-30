import React, { useContext, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import colorLayer from 'color-layer';

import { pageContext } from '../utils/pageContext';
import { gray6, radiusXl } from '../design/@generated/themes';

interface StateProps {
    title: string;
    hue?: number;
    size?: 's' | 'm';
    onClick?: () => void;
}

const mapThemeOnId = { light: 0, dark: 1 };

const StyledState = styled.div<{
    size: StateProps['size'];
    onClick: StateProps['onClick'];
}>`
    display: inline-block;
    padding: 6px 14px;

    border-radius: ${radiusXl};

    font-size: 14px;
    line-height: 14px;
    font-weight: 700;
    user-select: none;

    cursor: default;

    transition: background-color, color, border-color 300ms ease-in-out;

    & + & {
        margin-left: 6px;
    }

    color: var(--stroke);
    border: 3px solid var(--stroke);
    background-color: var(--bkg);

    &:hover {
        color: var(--strokeHover);
        border-color: var(--strokeHover);
        background-color: var(--bkgHover);
    }

    ${({ onClick }) =>
        onClick &&
        css`
            cursor: pointer;
        `}

    ${({ size }) =>
        size === 's' &&
        css`
            padding: 4px 10px;
            font-size: 12px;
        `}
`;

// eslint-disable-next-line react/display-name
export const State = React.forwardRef<HTMLDivElement, StateProps>(({ title, hue = 1, size = 'm', onClick }, ref) => {
    const { theme } = useContext(pageContext);
    const themeId = mapThemeOnId[theme || 'dark'];
    const [colors, setColors] = useState({
        '--bkg': 'transparent',
        '--stroke': gray6,
        '--bkgHover': 'transparent',
        '--strokeHover': gray6,
    } as React.CSSProperties);

    useEffect(() => {
        setColors(() => {
            const sat = hue === 1 ? 0 : undefined;
            return {
                '--bkg': colorLayer(hue, 3, sat)[themeId],
                '--stroke': colorLayer(hue, 9, sat)[themeId],
                '--bkgHover': colorLayer(hue, 4, sat)[themeId],
                '--strokeHover': colorLayer(hue, 10, sat)[themeId],
            } as React.CSSProperties;
        });
    }, [hue, themeId]);

    return (
        <StyledState ref={ref} size={size} onClick={onClick} style={colors}>
            {title}
        </StyledState>
    );
});
