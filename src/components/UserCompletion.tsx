import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { Input, useInput, Grid, useKeyboard, KeyCode } from '@geist-ui/core';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import {
    buttonBackgroundColorHover,
    buttonBorderColor,
    buttonBorderColorHover,
    buttonIconColor,
    buttonTextColor,
} from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { UserAnyKind } from '../../graphql/generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';

import { Button } from './Button';
import { Popup } from './Popup';
import { Icon } from './Icon';
import { UserPic } from './UserPic';

interface UserCompletionProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    text: React.ComponentProps<typeof Button>['text'];
    userPic?: React.ComponentProps<typeof Button>['iconLeft'];
    query?: string;
    placeholder?: string;
    onClick?: (user: UserAnyKind) => void;
}

const StyledUserCard = styled.div<{ focused?: boolean }>`
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

    ${({ focused }) =>
        focused &&
        css`
            border-color: ${buttonBorderColorHover};
            background-color: ${buttonBackgroundColorHover};
        `}
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
const UserCard: React.FC<{
    name?: string;
    email?: string;
    image?: string;
    focused?: boolean;
    onClick?: () => void;
}> = ({ name, email, image, focused, onClick }) => {
    return (
        <StyledUserCard onClick={onClick} focused={focused}>
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

export const UserCompletion: React.FC<UserCompletionProps> = ({
    size,
    text,
    view,
    userPic,
    onClick,
    query = '',
    placeholder,
}) => {
    const { data: session } = useSession();
    const popupRef = useRef<any>();
    const buttonRef = useRef<any>();
    const [popupVisible, setPopupVisibility] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const { state: inputState, setState: setInputState, reset: inputReset, bindings: onInput } = useInput(query);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState(0);

    const onClickOutside = () => {
        setEditMode(false);
        setPopupVisibility(false);
        inputReset();
    };

    const onButtonClick = () => {
        setEditMode(true);
        setPopupVisibility(true);
    };

    const onInputBlur = () => {};

    const { data } = useSWR(inputState, (q) => fetcher(session?.user, q));

    const onUserCardClick = (user: UserAnyKind) => () => {
        setEditMode(false);
        setPopupVisibility(false);
        onClick && onClick(user);
        setInputState(user.name || user.email || '');
    };

    const { bindings: onESC } = useKeyboard(
        () => {
            popupVisible && setPopupVisibility(false);
            setEditMode(false);
        },
        [KeyCode.Escape],
        {
            stopPropagation: true,
        },
    );

    const { bindings: onENTER } = useKeyboard(
        () => {
            if (data?.findUserAnyKind?.length) {
                onUserCardClick(data?.findUserAnyKind[cursor])();
                popupRef.current?.focus();
            }
        },
        [KeyCode.Enter],
        {
            stopPropagation: true,
        },
    );

    useEffect(() => {
        const findUserAnyKind = data?.findUserAnyKind;

        if (findUserAnyKind?.length && downPress) {
            setCursor((prevState) => (prevState < findUserAnyKind.length - 1 ? prevState + 1 : prevState));
        }
    }, [data?.findUserAnyKind, downPress]);

    useEffect(() => {
        if (data?.findUserAnyKind?.length && upPress) {
            setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [data?.findUserAnyKind, upPress]);

    return (
        <>
            <StyledDropdownContainer ref={popupRef} {...onESC}>
                {editMode ? (
                    <Input
                        placeholder={placeholder}
                        scale={0.8}
                        autoFocus
                        icon={userPic}
                        onBlur={onInputBlur}
                        {...onInput}
                        {...onENTER}
                    />
                ) : (
                    <Button
                        ref={buttonRef}
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
                visible={popupVisible && Boolean(data?.findUserAnyKind?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                <>
                    {data?.findUserAnyKind?.map((u, i) => (
                        <UserCard
                            key={u.id}
                            name={u.name}
                            email={u.email}
                            image={u.image}
                            focused={cursor === i}
                            onClick={onUserCardClick(u)}
                        />
                    ))}
                </>
            </Popup>
        </>
    );
};
