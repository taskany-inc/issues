import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { createFetcher } from '../utils/createFetcher';
import { Activity } from '../../graphql/@generated/genql';
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

    onClick?: (user: Activity) => void;
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

export const UserCompletionInput: React.FC<UserCompletionInputProps> = ({
    onClick,
    query = '',
    filter,
    placeholder,
}) => {
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

    const { data } = useSWR(inputState, (q) => fetcher(session?.user, q, filter));

    const onInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (data?.findActivity?.length) {
                setPopupVisibility(true);
            }

            setInputState(e.target.value);
        },
        [data?.findActivity],
    );

    const onUserCardClick = useCallback(
        (activity: Activity) => () => {
            setPopupVisibility(false);
            onClick && onClick(activity);
            setInputState('');
        },
        [onClick],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        popupVisible && setPopupVisibility(false);
    });

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        if (data?.findActivity?.length) {
            onUserCardClick(data?.findActivity[cursor])();
            popupRef.current?.focus();
        }
    });

    useEffect(() => {
        const findActivity = data?.findActivity;

        if (findActivity?.length && downPress) {
            setCursor((prevState) => (prevState < findActivity.length - 1 ? prevState + 1 : prevState));
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
