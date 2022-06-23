import React, { useContext, useEffect, useMemo, useState } from 'react';
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
    onClick: StateDotProps['onClick'];
    colors: {
        bkg: string;
        bkgHover: string;
    };
}>`
    width: 14px;
    height: 14px;
    border-radius: 100%;

    transition: background-color 300ms ease-in-out;

    & + & {
        margin-left: 6px;
    }

    ${({ colors }) => css`
        background-color: ${colors.bkg};

        &:hover {
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
            width: 10px;
            height: 10px;
        `}
`;

// eslint-disable-next-line react/display-name
export const StateDot: React.FC<StateDotProps> = React.memo(({ title, hue = 1, size = 'm', onClick }) => {
    const { theme } = useContext(pageContext);
    const [themeId, setThemeId] = useState(0); // default: dark

    useEffect(() => {
        theme && setThemeId(mapThemeOnId[theme]);
    }, [theme]);

    const colors = useMemo(() => {
        const sat = hue === 1 ? 0 : undefined;

        return {
            bkg: colorLayer(hue, 9, sat)[themeId],
            bkgHover: colorLayer(hue, 10, sat)[themeId],
        };
    }, [hue, themeId]);

    return <StyledStateDot title={title} size={size} onClick={onClick} colors={colors} />;
});
