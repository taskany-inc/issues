import { FC, useMemo } from 'react';
import colorLayer from 'color-layer';
import { MarkedListItem } from '@taskany/bricks';

import { usePageContext } from '../hooks/usePageContext';

export const ColorizedMenuItem: FC<{
    hue: number;
    children?: React.ReactNode;
    focused?: boolean;
    checked?: boolean;
    onClick?: () => void;
}> = ({ hue, children, ...props }) => {
    const { themeId } = usePageContext();
    const hoverColor = useMemo(() => colorLayer(hue, 5, hue === 1 ? 0 : undefined)[themeId], [hue, themeId]);

    return (
        <MarkedListItem hoverColor={hoverColor} {...props}>
            {children}
        </MarkedListItem>
    );
};
