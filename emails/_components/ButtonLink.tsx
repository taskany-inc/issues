import React from 'react';
import { Link } from '@react-email/components';

import { Typography } from './Typography';

interface ButtonLinkProps {
    title: string;
    href: string;
}

const buttonLinkStyles = {
    padding: '4px 10px 7px',
    backgroundColor: '#2F2F37',
    borderRadius: '4px',
};

export const ButtonLink: React.FC<ButtonLinkProps> = ({ title, href }) => {
    return (
        <Link href={href} title={title} style={buttonLinkStyles}>
            <Typography size="s" style={{ display: 'inline' }}>
                {title}
            </Typography>
        </Link>
    );
};
