import React, { useMemo } from 'react';
import { StateDot as StateDotBrick, StateDotProps } from '@taskany/bricks';
import colorLayer from 'color-layer';

import { usePageContext } from '../hooks/usePageContext';

// eslint-disable-next-line react/display-name
export const StateDot: React.FC<Omit<StateDotProps & { hue?: number }, 'hoverColor' | 'color'>> = React.memo(
    ({ hue = 1, ...props }) => {
        const { themeId = 1 } = usePageContext();
        const { color, hoverColor } = useMemo(() => {
            const sat = hue === 1 ? 0 : undefined;
            return {
                color: colorLayer(hue, 10, sat)[themeId],
                hoverColor: colorLayer(hue, 9, sat)[themeId],
            };
        }, [hue, themeId]);

        return <StateDotBrick color={color} hoverColor={hoverColor} {...props} />;
    },
);
