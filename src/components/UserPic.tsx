import React from 'react';
import styled from 'styled-components';

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

    const imgPath = src || '/anonymous.png';

    return (
        <StyledImage
            className={className}
            src={imgPath}
            height={sizePx}
            width={sizePx}
            onClick={src ? undefined : onClick}
        />
    );
};
