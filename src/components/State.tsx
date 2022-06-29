import React, { useContext, useMemo, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import colorLayer from 'color-layer';

import { pageContext } from '../utils/pageContext';
import { radiusXl } from '../design/@generated/themes';

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
    colors: {
        bkg: string;
        stroke: string;
        bkgHover: string;
        strokeHover: string;
    };
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

    ${({ colors }) =>
        css`
            color: ${colors.stroke};
            border: 3px solid ${colors.stroke};
            background-color: ${colors.bkg};

            &:hover {
                color: ${colors.strokeHover};
                border-color: ${colors.strokeHover};
                background-color: ${colors.bkgHover};
            }
        `}

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
export const State = React.memo(
    React.forwardRef<HTMLDivElement, StateProps>(({ title, hue = 1, size = 'm', onClick }, ref) => {
        const { theme } = useContext(pageContext);
        const [themeId, setThemeId] = useState(0); // default: dark

        useEffect(() => {
            theme && setThemeId(mapThemeOnId[theme]);
        }, [theme]);

        const colors = useMemo(() => {
            const sat = hue === 1 ? 0 : undefined;
            return {
                bkg: colorLayer(hue, 3, sat)[themeId],
                stroke: colorLayer(hue, 9, sat)[themeId],
                bkgHover: colorLayer(hue, 4, sat)[themeId],
                strokeHover: colorLayer(hue, 10, sat)[themeId],
            };
        }, [hue, themeId]);

        return (
            <StyledState ref={ref} size={size} onClick={onClick} colors={colors}>
                {title}
            </StyledState>
        );
    }),
);
