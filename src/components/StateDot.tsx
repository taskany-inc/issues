import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import colorLayer from 'color-layer';

import { pageContext } from '../utils/pageContext';

interface StateDotProps {
    title?: string;
    hue?: number;
    size?: 's' | 'm';
    onClick?: () => void;
}

const mapThemeOnId = { light: 0, dark: 1 };

const StyledStateDot = styled.div<{
    size: StateDotProps['size'];
    hue: StateDotProps['hue'];
    onClick: StateDotProps['onClick'];
    themeId: number;
}>`
    width: 14px;
    height: 14px;
    border-radius: 100%;

    transition: background-color 300ms ease-in-out;

    & + & {
        margin-left: 6px;
    }

    ${({ hue = 1, themeId }) => {
        const sat = hue === 1 ? 0 : undefined;
        const bkg = colorLayer(hue, 9, sat)[themeId];
        const bkgHover = colorLayer(hue, 10, sat)[themeId];

        return (
            hue &&
            css`
                background-color: ${bkg};

                &:hover {
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
            width: 10px;
            height: 10px;
        `}
`;

export const StateDot: React.FC<StateDotProps> = ({ title, hue = 1, size = 'm', onClick }) => {
    const { theme } = useContext(pageContext);

    return (
        <StyledStateDot
            title={title}
            size={size}
            hue={hue}
            onClick={onClick}
            themeId={theme ? mapThemeOnId[theme] : 1}
        />
    );
};
