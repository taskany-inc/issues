import { MDXProvider } from '@mdx-js/react';
import Head from 'next/head';
import { useTheme } from 'next-themes';

import { markdownComponents } from '../hooks/useMarkdown';

interface WhatsNewLayoutProps {
    children: React.ReactNode;
}

export const WhatsNewLayout: React.FC<WhatsNewLayoutProps> = ({ children }) => {
    const { resolvedTheme } = useTheme();

    return (
        <MDXProvider components={markdownComponents}>
            <Head>
                <link rel="stylesheet" id="themeVariables" href={`/theme/${resolvedTheme}.css`} />
            </Head>
            {children}
        </MDXProvider>
    );
};
