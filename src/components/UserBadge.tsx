import React from 'react';
import styled from 'styled-components';
import { Text, UserPic } from '@taskany/bricks';
import { gapS, gapXs, gray9 } from '@taskany/colors';

import { getUserName } from '../utils/getUserName';
import { UserData } from '../types/common';

import { BadgeCleanButton } from './BadgeCleanButton';

interface UserBadgeProps {
    user: UserData;
    children?: React.ReactNode;
    className?: string;
}

const StyledUserBadge = styled.span`
    position: relative;
    display: flex;
    align-items: center;
    padding: ${gapXs} 0;
    width: fit-content;

    &:hover {
        ${BadgeCleanButton} {
            visibility: visible;

            cursor: pointer;
        }
    }
`;

const StyledText = styled(Text).attrs({
    color: gray9,
    size: 's',
    ellipsis: true,
})`
    padding: 0 ${gapXs} 0 ${gapS};
`;

export const UserBadge: React.FC<UserBadgeProps> = ({ user, children, className }) => {
    return (
        <StyledUserBadge className={className}>
            <UserPic src={user?.image} email={user?.email} size={24} />

            <StyledText>{getUserName(user)}</StyledText>

            {children}
        </StyledUserBadge>
    );
};
