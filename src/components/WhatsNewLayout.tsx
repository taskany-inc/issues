import { MDXProvider } from '@mdx-js/react';
import Head from 'next/head';
import { Md } from '@taskany/bricks/harmony';
import { useTheme } from 'next-themes';

interface WhatsNewLayoutProps {
    children: React.ReactNode;
}

const components = {};

export const WhatsNewLayout: React.FC<WhatsNewLayoutProps> = ({ children }) => {
    const { resolvedTheme } = useTheme();

    return (
        <MDXProvider components={components}>
            <Head>
                <link rel="stylesheet" id="themeVariables" href={`/theme/${resolvedTheme}.css`} />
            </Head>

            <Md>{children}</Md>
        </MDXProvider>
    );
};
