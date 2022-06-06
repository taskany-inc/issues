import React from 'react';
import styled from 'styled-components';

import { Icon } from './Icon';

interface UserPicProps {
    src?: string | null;
    size?: number;
    onClick?: () => void;
}

const StyledImage = styled.img`
    border: 0;
    border-radius: 100%;
`;

export const UserPic: React.FC<UserPicProps> = ({ src, size = 32, onClick }) => {
    const sizePx = `${size}px`;

    return src ? (
        <StyledImage src={src} height={sizePx} width={sizePx} />
    ) : (
        <Icon type="user" size={size} onClick={onClick} />
    );
};
