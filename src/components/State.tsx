import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import colorLayer from 'color-layer';
import { gapS, gapXs, gray6, radiusXl } from '@taskany/colors';

import { usePageContext } from '../hooks/usePageContext';

interface StateProps {
    title: string;
    hue?: number;
    size?: 's' | 'm';
    onClick?: () => void;
}

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

    ${({ onClick }) =>
        onClick &&
        `
            cursor: pointer;

            &:hover {
                color: var(--strokeHover);
                border-color: var(--strokeHover);
                background-color: var(--bkgHover);
            }
        `}

    ${({ size }) =>
        size === 's' &&
        `
            padding: calc(${gapXs}/2) ${gapS};
            font-size: 12px;
            border: 2px solid var(--stroke);
            font-weight: 500;
        `}
`;

// eslint-disable-next-line react/display-name
export const State = React.forwardRef<HTMLDivElement, StateProps>(({ title, hue = 1, size = 'm', onClick }, ref) => {
    const { themeId } = usePageContext();
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
                '--stroke': colorLayer(hue, 10, sat)[themeId],
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
