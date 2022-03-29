import { Tooltip } from '@geist-ui/core';
import React from 'react';
import styled from 'styled-components';
import { signIn } from 'next-auth/react';

import { textColorPrimary } from '../design/@generated/themes';
import { Icon } from './Icon';

interface UserPicProps {
    src?: string | null;
    size?: number;
    title?: React.ReactNode;
}

const StyledImage = styled.img`
    border: 0;
    border-radius: 100%;

    display: inline-block;
    vertical-align: middle;
`;

const StyledToolipContent = styled.div`
    min-width: 100px;
`;

export const UserPic: React.FC<UserPicProps> = ({ src, title, size = 32 }) => {
    const sizePx = `${size}px`;

    return src ? (
        <Tooltip text={<StyledToolipContent>{title}</StyledToolipContent>} type="lite" hideArrow placement="left">
            <StyledImage src={src} height={sizePx} width={sizePx} />
        </Tooltip>
    ) : (
        <Icon type="user" size="s" color={textColorPrimary} onClick={() => signIn()} />
    );
};
