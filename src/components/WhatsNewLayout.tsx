import { MDXProvider } from '@mdx-js/react';
import { Md, TextStyle, nullable } from '@taskany/bricks';
import { useTheme } from 'next-themes';

import { PageContext } from '../utils/pageContext';

import { GlobalStyle } from './GlobalStyle';
import { Theme } from './Theme';

interface WhatsNewLayoutProps {
    children: React.ReactNode;
}

const components = {};

export const WhatsNewLayout: React.FC<WhatsNewLayoutProps> = ({ children }) => {
    const { resolvedTheme } = useTheme();

    return (
        <MDXProvider components={components}>
            <GlobalStyle />
            <TextStyle />

            {nullable(resolvedTheme as PageContext['theme'], (t) => (
                <Theme theme={t} />
            ))}

            <Md>{children}</Md>
        </MDXProvider>
    );
};
