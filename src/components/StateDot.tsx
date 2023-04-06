import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import colorLayer from 'color-layer';
import { gray6 } from '@taskany/colors';

import { usePageContext } from '../hooks/usePageContext';

interface StateDotProps {
    title?: string;
    hue?: number;
    size?: 's' | 'm';

    onClick?: () => void;
}

const StyledStateDot = styled.div<{
    size: StateDotProps['size'];
    onClick: StateDotProps['onClick'];
}>`
    width: 14px;
    height: 14px;
    border-radius: 100%;

    transition: background-color 300ms ease-in-out;

    & + & {
        margin-left: 6px;
    }

    background-color: var(--bkg);

    /* &:hover {
        background-color: var(--bkg-hover);
    } */

    ${({ onClick }) =>
        onClick &&
        `
            cursor: pointer;
        `}

    ${({ size }) =>
        size === 's' &&
        `
            width: 10px;
            height: 10px;
        `}
`;

// eslint-disable-next-line react/display-name
export const StateDot: React.FC<StateDotProps> = React.memo(({ title, hue = 1, size = 'm', onClick }) => {
    const { themeId } = usePageContext();
    const [colors, setColors] = useState({
        '--bkg': gray6,
        '--bkgHover': gray6,
    } as React.CSSProperties);

    useEffect(() => {
        setColors(() => {
            const sat = hue === 1 ? 0 : undefined;
            return {
                '--bkg': colorLayer(hue, 9, sat)[themeId],
                '--bkgHover': colorLayer(hue, 10, sat)[themeId],
            } as React.CSSProperties;
        });
    }, [hue, themeId]);

    return <StyledStateDot title={title} size={size} onClick={onClick} style={colors} />;
});
