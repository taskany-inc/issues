import React from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

const Gravatar = dynamic(() => import('./Gravatar'));

interface UserPicProps {
    src?: string | null;
    size?: number;
    className?: string;

    onClick?: () => void;
}

const StyledImage = styled.img`
    border: 0;
    border-radius: 100%;
`;

export const UserPic: React.FC<UserPicProps> = ({ src, size = 32, className, onClick }) => {
    const sizePx = `${size}px`;
    const { data: session } = useSession();

    if (src) {
        return (
            <StyledImage
                className={className}
                src={src}
                height={sizePx}
                width={sizePx}
                onClick={src ? undefined : onClick}
            />
        );
    }

    if (session?.user) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return <Gravatar email={session.user.email} size={Number(sizePx.split('px')[0])} onClick={onClick} />;
    }

    return <StyledImage className={className} src="/anonymous.png" height={sizePx} width={sizePx} onClick={onClick} />;
};
