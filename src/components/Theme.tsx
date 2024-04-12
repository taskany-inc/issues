import React from 'react';
import dynamic from 'next/dynamic';
import { nullable } from '@taskany/bricks';

const themes = {
    dark: dynamic(() => import('@taskany/colors/themes/dark')),
    light: dynamic(() => import('@taskany/colors/themes/light')),
};
// TODO: remove this component after https://github.com/taskany-inc/colors/issues/174
export const Theme: React.FC<{ theme: keyof typeof themes }> = ({ theme = 'dark' }) => {
    const ThemeComponent = themes[theme];

    return (
        <>
            {nullable(ThemeComponent, () => (
                <ThemeComponent />
            ))}
        </>
    );
};
