import React from 'react';
import dynamic from 'next/dynamic';

const themes = {
    dark: dynamic(() => import('../design/@generated/themes/dark')),
    light: dynamic(() => import('../design/@generated/themes/light')),
};

export const Theme: React.FC<{ theme: keyof typeof themes }> = ({ theme }) => {
    const ThemeComponent = themes[theme];

    return <ThemeComponent />;
};
