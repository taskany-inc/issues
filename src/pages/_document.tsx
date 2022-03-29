import Document, { DocumentContext } from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import { CssBaseline } from '@geist-ui/core';

export default class MyDocument extends Document {
    static async getInitialProps(ctx: DocumentContext) {
        const sheet = new ServerStyleSheet();
        const originalRenderPage = ctx.renderPage;

        try {
            ctx.renderPage = () =>
                originalRenderPage({
                    enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
                });

            const initialProps = await Document.getInitialProps(ctx);
            const styles = CssBaseline.flush();

            return {
                ...initialProps,
                styles: (
                    <>
                        {initialProps.styles}
                        {styles}
                        {sheet.getStyleElement()}
                    </>
                ),
            };
        } finally {
            sheet.seal();
        }
    }
}
