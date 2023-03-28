import React from 'react';
import styled from 'styled-components';

import { gray3, textColor, link10 } from '../../design/@generated/themes';

import { nullable } from './utils/nullable';
import { UserPic } from './UserPic';

interface UserMenuProps {
    notifications?: boolean;
    avatar?: string;
    email?: string;
    onClick?: () => void;
}

const StyledMenuWrapper = styled.div`
    position: relative;
`;

const StyledNotifier = styled.div`
    position: absolute;
    top: 0px;
    right: -4px;
    box-sizing: border-box;
    width: 9px;
    height: 9px;

    border-radius: 100%;

    cursor: pointer;
    user-select: none;

    box-shadow: 0 0 0 2px ${gray3};
    background-color: ${link10};

    &:hover {
        box-shadow: 0px 0px 0px 2px ${link10}, 1px 1px 2px 0px ${textColor};
    }
`;

export const UserMenu = ({ notifications, avatar, email, onClick }: UserMenuProps) => {
    return (
        <StyledMenuWrapper>
            {nullable(notifications, () => (
                <StyledNotifier />
            ))}

            <UserPic src={avatar} email={email} onClick={onClick} size={32} />
        </StyledMenuWrapper>
    );
};
