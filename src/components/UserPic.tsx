import React from 'react';
import styled from 'styled-components';
import { signIn } from 'next-auth/react';

import { Icon } from './Icon';

interface UserPicProps {
    src?: string | null;
    size?: number;
}

const StyledImage = styled.img`
    border: 0;
    border-radius: 100%;
    justify-self: center;
`;

export const UserPic: React.FC<UserPicProps> = ({ src, size = 32 }) => {
    const sizePx = `${size}px`;

    return src ? (
        <StyledImage src={src} height={sizePx} width={sizePx} />
    ) : (
        <Icon type="user" size="s" onClick={() => signIn()} />
    );
};
