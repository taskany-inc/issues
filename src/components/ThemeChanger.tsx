import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import styled from 'styled-components';

import { Icon } from './Icon';

const StyledThemeChanger = styled.div`
    cursor: pointer;
`;

export const ThemeChanger = () => {
    const [mounted, setMounted] = useState(false);

    const { theme, setTheme } = useTheme();

    // When mounted on client, now we can show the UI
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <StyledThemeChanger>
            {theme === 'dark' ? (
                <Icon type="sun" size="s" onClick={() => setTheme('light')} />
            ) : (
                <Icon type="moon" size="s" onClick={() => setTheme('dark')} />
            )}
        </StyledThemeChanger>
    );
};
