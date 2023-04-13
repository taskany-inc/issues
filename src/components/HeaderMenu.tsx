import React from 'react';
import styled from 'styled-components';
import { signIn } from 'next-auth/react';
import NextLink from 'next/link';
import { gray3, textColor, link10 } from '@taskany/colors';
import { Link, nullable } from '@taskany/bricks';

import { routes } from '../hooks/router';
import { usePageContext } from '../hooks/usePageContext';

import { UserPic } from './UserPic';

interface HeaderMenuProps {
    notifications?: boolean;
}

const StyledHeaderMenu = styled.div`
    position: relative;
    justify-self: end;
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

export const HeaderMenu = ({ notifications }: HeaderMenuProps) => {
    const { user } = usePageContext();

    return (
        <StyledHeaderMenu>
            {nullable(notifications, () => (
                <StyledNotifier />
            ))}

            {user ? (
                <NextLink href={routes.userSettings()} passHref>
                    <Link inline>
                        <UserPic src={user.image} email={user.email} size={32} />
                    </Link>
                </NextLink>
            ) : (
                <UserPic size={32} onClick={() => signIn()} />
            )}
        </StyledHeaderMenu>
    );
};
