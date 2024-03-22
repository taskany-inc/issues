import React from 'react';
import { Column, Section, Row, Img, Link } from '@react-email/components';

interface HeaderProps {
    logoUrl: string;
    title: string;
    baseUrl: string;
    hint?: React.ReactNode;
}

const sectionStyles = {
    paddingBottom: '30px',
};

const offsetStyles = {
    paddingBottom: '10px',
};

const rowStyles = {
    borderBottom: '1px solid #2f2f37',
};

export const Header: React.FC<React.PropsWithChildren<HeaderProps>> = ({ logoUrl, title, baseUrl, hint, children }) => {
    return (
        <Section style={sectionStyles}>
            <Row style={offsetStyles}>
                <Column style={{ width: '66px' }}>
                    <Link href={baseUrl} title={title}>
                        <Img src={logoUrl} alt={title} width={48} height={48} />
                    </Link>
                </Column>
                {hint != null ? <Column>{hint}</Column> : null}
            </Row>
            {children != null ? <Row style={{ ...offsetStyles, ...rowStyles }}>{children}</Row> : null}
        </Section>
    );
};
