import React, { useCallback } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

const Gravatar = dynamic(() => import('./Gravatar'));

interface UserPicProps {
    src?: string | null;
    size?: number;
    email?: string;
    className?: string;

    onClick?: () => void;
}

const StyledImage = styled.img`
    border: 0;
    border-radius: 100%;
`;

export const UserPic: React.FC<UserPicProps> = ({ src, email, size = 32, className, onClick }) => {
    const sizePx = `${size}px`;

    const onLoadError: React.ReactEventHandler<HTMLImageElement> = useCallback(({ currentTarget }) => {
        currentTarget.onerror = null;
        currentTarget.src = '/anonymous.png';
    }, []);

    if (src) {
        return (
            <StyledImage
                className={className}
                src={src}
                height={sizePx}
                width={sizePx}
                onClick={src ? undefined : onClick}
                onError={onLoadError}
            />
        );
    }

    if (email) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return <Gravatar className={className} email={email} size={Number(sizePx.split('px')[0])} onClick={onClick} />;
    }

    return <StyledImage className={className} src="/anonymous.png" height={sizePx} width={sizePx} onClick={onClick} />;
};
