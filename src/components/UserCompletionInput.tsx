import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { createFetcher } from '../utils/createFetcher';
import { UserAnyKind } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';

import { Popup } from './Popup';
import { FormInput } from './FormInput';
import { UserDropdownItem } from './UserDropdownItem';

interface UserCompletionInputProps {
    query?: string;
    placeholder?: string;
    filter?: string[];
    title?: string;

    onClick?: (user: UserAnyKind) => void;
}

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

export const UserCompletionInput: React.FC<UserCompletionInputProps> = ({ onClick, query = '', placeholder }) => {
    const { data: session } = useSession();
    const popupRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const [inputState, setInputState] = useState(query);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState(0);

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
        setInputState(query);
    }, [query]);

    const { data } = useSWR(inputState, (q) => fetcher(session?.user, q));

    const onInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (data?.findUserAnyKind?.length) {
                setPopupVisibility(true);
            }

            setInputState(e.target.value);
        },
        [data?.findUserAnyKind],
    );

    const onUserCardClick = useCallback(
        (user: UserAnyKind) => () => {
            setPopupVisibility(false);
            onClick && onClick(user);
            setInputState('');
        },
        [onClick],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        popupVisible && setPopupVisibility(false);
    });

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        if (data?.findUserAnyKind?.length) {
            onUserCardClick(data?.findUserAnyKind[cursor])();
            popupRef.current?.focus();
        }
    });

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
                <FormInput
                    ref={inputRef}
                    autoFocus
                    placeholder={placeholder}
                    value={inputState}
                    onChange={onInputChange}
                    {...onENTER}
                />
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
                        <UserDropdownItem
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
