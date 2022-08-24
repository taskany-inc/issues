import React from 'react';
import md5Hash from 'md5';
import styled from 'styled-components';

import { isRetina } from '../utils/isRetina';

interface GravatarProps {
    email: string;
    md5?: string;
    size: number;
    rating?: string;
    def?: string;
    className?: string;
    domain?: string;

    onClick?: () => void;
}

const StyledImage = styled.img`
    border: 0;
    border-radius: 100%;
`;

const Gravatar = ({
    size = 50,
    rating = 'g',
    def = 'retro',
    domain = process.env.NEXT_PUBLIC_GRAVATAR_HOST || 'www.gravatar.com',
    email,
    md5,
    className,
    onClick,
}: GravatarProps) => {
    const base = `//${domain}/avatar/`;

    const query = new URLSearchParams({
        s: String(size),
        r: rating,
        d: def,
    });

    const retinaQuery = new URLSearchParams({
        s: String(size * 2),
        r: rating,
        d: def,
    });

    const formattedEmail = email.trim().toLowerCase();

    let hash;
    if (md5) {
        hash = md5;
    } else if (typeof email === 'string') {
        hash = md5Hash(formattedEmail, { encoding: 'binary' });
    } else {
        // eslint-disable-next-line no-console
        console.warn('Gravatar image can not be fetched. Either the "email" or "md5" prop must be specified.');
        return <script />;
    }

    const src = `${base}${hash}?${query}`;
    const retinaSrc = `${base}${hash}?${retinaQuery}`;

    let modernBrowser = true; // server-side, we render for modern browsers

    if (typeof window !== 'undefined') {
        modernBrowser = 'srcset' in document.createElement('img');
    }

    return (
        <StyledImage
            alt={`Gravatar for ${formattedEmail}`}
            src={!modernBrowser && isRetina() ? retinaSrc : src}
            height={size}
            width={size}
            className={className}
            onClick={onClick}
        />
    );
};

export default Gravatar;
