import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useToasts } from '@geist-ui/core';
import styled from 'styled-components';

import { Icon } from './Icon';
import { textColorPrimary } from '../design/@generated/themes';

const StyledThemeChanger = styled.div`
    cursor: pointer;
`;

export const ThemeChanger = () => {
    const [mounted, setMounted] = useState(false);
    const { setToast } = useToasts();

    const { theme, setTheme } = useTheme();

    // When mounted on client, now we can show the UI
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <StyledThemeChanger>
            {theme === 'dark' ? (
                <Icon
                    type="sun"
                    size="s"
                    color={textColorPrimary}
                    onClick={() => {
                        setTheme('light');
                        setToast({
                            text: `The current theme is light`,
                            type: 'success',
                        });
                    }}
                />
            ) : (
                <Icon
                    type="moon"
                    size="s"
                    color={textColorPrimary}
                    onClick={() => {
                        setTheme('dark');
                        setToast({
                            text: `The current theme is dark`,
                            type: 'success',
                        });
                    }}
                />
            )}
        </StyledThemeChanger>
    );
};
