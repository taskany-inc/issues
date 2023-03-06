import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

const StyledImage = styled.img<{ visible: boolean }>`
    border: 0;
    border-radius: 100%;

    opacity: 1;
    transition: opacity 50ms ease-in;

    ${({ visible }) =>
        !visible &&
        `
        opacity: 0;
    `}
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
    const [modernBrowser, setModernBrowser] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useLayoutEffect(() => {
        setModernBrowser('srcset' in document.createElement('img'));
        setMounted(true);
    }, []);

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

    const onLoadError: React.ReactEventHandler<HTMLImageElement> = useCallback(({ currentTarget }) => {
        currentTarget.onerror = null;
        currentTarget.src = '/anonymous.png';
    }, []);

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

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (imgRef.current && mounted) {
            imgRef.current.src = modernBrowser && isRetina() ? retinaSrc : src;
            setVisible(true);
        }
    }, [imgRef, mounted, modernBrowser, src, retinaSrc]);

    return (
        <StyledImage
            visible={visible}
            ref={imgRef}
            alt={`Gravatar for ${formattedEmail}`}
            src="/anonymous.png"
            height={size}
            width={size}
            className={className}
            onClick={onClick}
            onError={onLoadError}
        />
    );
};

export default Gravatar;
