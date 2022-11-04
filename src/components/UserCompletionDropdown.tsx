import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { createFetcher } from '../utils/createFetcher';
import { Activity } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';

import { Button } from './Button';
import { Popup } from './Popup';
import { Input } from './Input';
import { UserDropdownItem } from './UserDropdownItem';

interface UserCompletionDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    tabIndex?: React.ComponentProps<typeof Button>['tabIndex'];
    userPic?: React.ComponentProps<typeof Button>['iconLeft'];
    query?: string;
    placeholder?: string;
    title?: string;
    filter?: string[];

    onClick?: (activity: Activity) => void;
}

const StyledDropdownContainer = styled.div``;

const fetcher = createFetcher((_, query: string, filter?: string[]) => ({
    findActivity: [
        {
            data: {
                query,
                filter,
            },
        },
        {
            id: true,
            user: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
            ghost: {
                id: true,
                email: true,
            },
        },
    ],
}));

const UserCompletionDropdown: React.FC<UserCompletionDropdownProps> = ({
    size = 'm',
    text,
    view,
    tabIndex,
    userPic,
    onClick,
    query = '',
    filter,
    title,
    placeholder,
}) => {
    const { data: session } = useSession();
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [inputState, setInputState] = useState(query);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState(0);

    const onClickOutside = useCallback(() => {
        setEditMode(false);
        setPopupVisibility(false);
        setInputState(query);
    }, [query]);

    const onButtonClick = useCallback(() => {
        setEditMode(true);
        setPopupVisibility(true);
    }, []);

    const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputState(e.target.value);
    }, []);

    const { data } = useSWR(inputState, (q) => fetcher(session?.user, q, filter));

    const onUserCardClick = useCallback(
        (activity: Activity) => () => {
            setEditMode(false);
            setPopupVisibility(false);
            onClick && onClick(activity);
            setInputState(activity.user?.name || activity.user?.email || activity.ghost?.email || '');
        },
        [onClick],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        popupVisible && setPopupVisibility(false);
        setEditMode(false);
    });

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        if (data?.findActivity?.length) {
            onUserCardClick(data?.findActivity[cursor])();
            popupRef.current?.focus();
        }
    });

    useEffect(() => {
        const findUserAnyKind = data?.findActivity;

        if (findUserAnyKind?.length && downPress) {
            setCursor((prevState) => (prevState < findUserAnyKind.length - 1 ? prevState + 1 : prevState));
        }
    }, [data?.findActivity, downPress]);

    useEffect(() => {
        if (data?.findActivity?.length && upPress) {
            setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [data?.findActivity, upPress]);

    return (
        <>
            <StyledDropdownContainer ref={popupRef} {...onESC}>
                {editMode ? (
                    <Input
                        autoFocus
                        placeholder={placeholder}
                        value={inputState}
                        onChange={onInputChange}
                        tabIndex={tabIndex}
                        {...onENTER}
                    />
                ) : (
                    <Button
                        ref={buttonRef}
                        size={size}
                        view={view}
                        text={text}
                        title={title}
                        iconLeft={userPic}
                        onClick={onButtonClick}
                        tabIndex={tabIndex}
                    />
                )}
            </StyledDropdownContainer>

            <Popup
                placement="top-start"
                overflow="hidden"
                visible={popupVisible && Boolean(data?.findActivity?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                <>
                    {data?.findActivity?.map((activity, i) => (
                        <UserDropdownItem
                            key={activity.id}
                            name={activity.user?.name}
                            email={activity.user?.email || activity.ghost?.email}
                            image={activity.user?.image}
                            focused={cursor === i}
                            onClick={onUserCardClick(activity)}
                        />
                    ))}
                </>
            </Popup>
        </>
    );
};

export default UserCompletionDropdown;
