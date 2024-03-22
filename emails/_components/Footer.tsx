import { Column, Row, Section, Link } from '@react-email/components';

import { Typography } from './Typography';

const sectionStyles = {
    paddingTop: '30px',
};

const rowStyles = {
    paddingTop: '14px',
    borderTop: '1px solid #2f2f37',
};

interface FooterProps {
    url: string;
    copyrights: string;
}

export const Footer: React.FC<FooterProps> = ({ url, copyrights }) => {
    return (
        <Section style={sectionStyles}>
            <Row style={rowStyles}>
                <Column>
                    <Link href={url}>
                        <Typography size="xs" weight="semiBold" color="ghost">
                            {copyrights}
                        </Typography>
                    </Link>
                </Column>
            </Row>
        </Section>
    );
};
