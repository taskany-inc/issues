import { Preview, Body } from '@react-email/components';

import { Footer } from './Footer';

interface LayoutProps {
    preview: string;
    baseUrl: string;
    summary?: string;
    copyrights: string;
}

const bodyStyles = {
    padding: 0,
    margin: 0,
    fontSize: '16px',
    color: '#E0E0E1',
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const boxStyles: React.CSSProperties = {
    maxWidth: '577px',
    width: '100%',
    padding: '30px',
    boxSizing: 'border-box',
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

export const Layout: React.FC<React.PropsWithChildren<LayoutProps>> = ({ children, baseUrl, summary, copyrights }) => {
    return (
        <>
            {summary ? <Preview>{summary}</Preview> : null}
            <Body style={bodyStyles}>
                <div style={{ backgroundColor: '#16161A' }}>
                    <div style={boxStyles}>
                        {children}
                        <Footer url={baseUrl} copyrights={copyrights} />
                    </div>
                </div>
            </Body>
        </>
    );
};
