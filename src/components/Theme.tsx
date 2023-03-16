import React from 'react';
import dynamic from 'next/dynamic';

import { nullable } from '@common/utils/nullable';

const themes = {
    dark: dynamic(() => import('../design/@generated/themes/dark')),
    light: dynamic(() => import('../design/@generated/themes/light')),
};

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
