import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';

import { nullable } from '../utils/nullable';
import { dispatchModalEvent, ModalEvent } from '../utils/dispatchModal';
import { routes } from '../hooks/router';
import { backgroundColor, brandColor, gapM, gray3, textColor, gray8, gapXs, link10 } from '../design/@generated/themes';

import { UserPic } from './UserPic';
import { Popup } from './Popup';
import { Link } from './Link';
import { Text } from './Text';

interface HeaderMenuProps {
    notifications?: boolean;
}

const StyledHeaderMenu = styled.div`
    position: relative;
    justify-self: end;
`;

const StyledPopupContent = styled.div`
    min-width: 120px;
`;

const StyledPlus = styled.div`
    position: absolute;
    display: flex;
    align-content: center;
    justify-content: center;
    top: 14px;
    left: -10px;
    box-sizing: border-box;
    width: 18px;
    height: 18px;

    font-size: 14px;
    font-weight: 400;

    box-shadow: 0 0 0 2px ${gray3};
    color: ${backgroundColor};
    background-color: ${brandColor};

    border-radius: 100%;

    cursor: pointer;
    user-select: none;

    transition: box-shadow 150ms ease-in-out;

    &:hover {
        font-weight: 600;

        box-shadow: 0px 0px 0px 2px ${brandColor}, 1px 1px 2px 0px ${textColor};
    }
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

const StyledMenuItem = styled.div`
    padding: ${gapXs} ${gapM};
`;

export const HeaderMenu = ({ notifications }: HeaderMenuProps) => {
    const t = useTranslations('HeaderMenu');
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const { data: session } = useSession();

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const togglePopup = useCallback(() => {
        setPopupVisibility(!popupVisible);
    }, [popupVisible]);

    return (
        <StyledHeaderMenu>
            <span ref={popupRef}>
                <StyledPlus ref={buttonRef} onClick={togglePopup}>
                    +
                </StyledPlus>
            </span>

            <Popup
                visible={popupVisible}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
            >
                <StyledPopupContent>
                    <StyledMenuItem>
                        <Link inline onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}>
                            {t('New goal')}
                        </Link>
                    </StyledMenuItem>
                    <StyledMenuItem>
                        <Link inline onClick={dispatchModalEvent(ModalEvent.ProjectCreateModal)}>
                            {t('New project')}
                        </Link>
                    </StyledMenuItem>
                    <StyledMenuItem>
                        <Link inline onClick={dispatchModalEvent(ModalEvent.UserInviteModal)}>
                            {t('Invite users')}
                        </Link>
                    </StyledMenuItem>
                    <StyledMenuItem>
                        <Text color={gray8}>
                            <Link inline onClick={() => signOut()}>
                                {t('Sign out')}
                            </Link>
                        </Text>
                    </StyledMenuItem>
                </StyledPopupContent>
            </Popup>

            {nullable(notifications, () => (
                <StyledNotifier />
            ))}

            <NextLink href={routes.userSettings()} passHref>
                <Link inline>
                    <UserPic src={session?.user.image} email={session?.user.email} size={32} />
                </Link>
            </NextLink>
        </StyledHeaderMenu>
    );
};
