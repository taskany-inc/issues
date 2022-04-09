import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { Input, useInput, Grid, useKeyboard, KeyCode } from '@geist-ui/core';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { Button } from './Button';
import { Popup } from './Popup';
import { Icon } from './Icon';
import { UserPic } from './UserPic';
import {
    buttonBackgroundColorHover,
    buttonBorderColor,
    buttonBorderColorHover,
    buttonIconColor,
    buttonTextColor,
} from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { UserAnyKind } from '../../graphql/generated/genql';

interface UserDropdownProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    text: React.ComponentProps<typeof Button>['text'];
    userPic?: React.ComponentProps<typeof Button>['iconLeft'];
    query?: string;
    onUserClick?: (user: UserAnyKind) => void;
}

const StyledUserCard = styled.div`
    padding: 6px;
    border: 1px solid ${buttonBorderColor};
    border-radius: 6px;
    min-width: 250px;
    margin-bottom: 4px;
    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        border-color: ${buttonBorderColorHover};
        background-color: ${buttonBackgroundColorHover};
    }
`;
const StyledUserInfo = styled.div`
    padding-left: 4px;
`;
const StyledUserName = styled.div`
    font-size: 14px;
    font-weight: 600;
`;
const StyledUserEmail = styled.div`
    font-size: 12px;
    color: ${buttonTextColor};
`;
const UserCard: React.FC<{ name?: string; email: string; image?: string; onClick?: () => void }> = ({
    name,
    email,
    image,
    onClick,
}) => {
    return (
        <StyledUserCard onClick={onClick}>
            <Grid.Container gap={0}>
                <Grid xs={3} alignItems="center" justify="center">
                    <UserPic src={image} size={24} />
                </Grid>
                <Grid xs={21} alignItems="center">
                    <StyledUserInfo>
                        <StyledUserName>{name}</StyledUserName>
                        <StyledUserEmail>{email}</StyledUserEmail>
                    </StyledUserInfo>
                </Grid>
            </Grid.Container>
        </StyledUserCard>
    );
};

const StyledDropdownContainer = styled.div``;

const fetcher = createFetcher((_, query: string) => ({
    findUserAnyKind: [
        {
            query,
        },
        {
            id: true,
            name: true,
            email: true,
            image: true,
            activity: {
                id: true,
            },
        },
    ],
}));

export const UserDropdown: React.FC<UserDropdownProps> = ({ size, text, view, userPic, onUserClick, query = '' }) => {
    const { data: session } = useSession();
    const popupRef = useRef<any>();
    const [popupVisible, setPopupVisibility] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const { state: inputState, setState: setInputState, reset: inputReset, bindings: inputBindings } = useInput(query);
    const onClickOutside = () => {
        setEditMode(false);
        setPopupVisibility(false);
        inputReset();
    }
    const onButtonClick = () => {
        setEditMode(true);
        setPopupVisibility(true);
    };
    const onInputBlur = () => {};
    const { data, error } = useSWR(inputState, (query) => fetcher(session?.user, query));
    const { bindings: hotkeyBindings } = useKeyboard(
        () => {
            popupVisible && setPopupVisibility(false);
            setEditMode(false);
        },
        [KeyCode.Escape],
        {
            stopPropagation: true,
        },
    );

    const onUserCardClick = (user: UserAnyKind) => () => {
        setEditMode(false);
        setPopupVisibility(false);
        onUserClick && onUserClick(user);
        setInputState(user.name || user.email || '');
    };

    return (
        <>
            <StyledDropdownContainer ref={popupRef} {...hotkeyBindings}>
                {editMode ? (
                    <Input
                        placeholder="Enter name or email"
                        scale={0.8}
                        icon={userPic}
                        autoFocus
                        onBlur={onInputBlur}
                        {...inputBindings}
                    />
                ) : (
                    <Button
                        tabIndex={0}
                        size={size}
                        view={view}
                        text={text}
                        iconLeft={userPic || <Icon type="user" size="xs" color={buttonIconColor} />}
                        onClick={onButtonClick}
                    />
                )}
            </StyledDropdownContainer>

            <Popup
                placement="top-start"
                overflow="hidden"
                visible={popupVisible}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                {data?.findUserAnyKind?.length ? (
                    <>
                        {data?.findUserAnyKind?.map((u) => (
                            <UserCard
                                key={u.id}
                                name={u.name}
                                email={u.email!}
                                image={u.image}
                                onClick={onUserCardClick(u)}
                            />
                        ))}
                    </>
                ) : (
                    'no body'
                )}
            </Popup>
        </>
    );
};
