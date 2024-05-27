import Document, { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

const ExternalScripts = process.env.INCLUDE_SCRIPTS_TO_MAIN_BUNDLE
    ? () => null
    : () => (
          <>
              <Script
                  strategy="beforeInteractive"
                  src="https://unpkg.com/react@18/umd/react.production.min.js"
              ></Script>
              <Script
                  strategy="beforeInteractive"
                  src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
              ></Script>
          </>
      );

export default class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    <ExternalScripts />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
