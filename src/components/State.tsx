import React, { useContext } from 'react';
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
    hue: StateProps['hue'];
    onClick: StateProps['onClick'];
    themeId: number;
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

    ${({ hue = 1, themeId }) => {
        const sat = hue === 1 ? 0 : undefined;
        const bkg = colorLayer(hue, 3, sat)[themeId];
        const stroke = colorLayer(hue, 9, sat)[themeId];
        const bkgHover = colorLayer(hue, 4, sat)[themeId];
        const strokeHover = colorLayer(hue, 10, sat)[themeId];

        return (
            hue &&
            css`
                color: ${stroke};
                border: 3px solid ${stroke};
                background-color: ${bkg};

                &:hover {
                    color: ${strokeHover};
                    border-color: ${strokeHover};
                    background-color: ${bkgHover};
                }
            `
        );
    }}

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

export const State: React.FC<StateProps> = ({ title, hue = 1, size = 'm', onClick }) => {
    const { theme } = useContext(pageContext);

    return (
        <StyledState size={size} hue={hue} onClick={onClick} themeId={theme ? mapThemeOnId[theme] : 1}>
            {title}
        </StyledState>
    );
};
