import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { gray6, gray7, gray8, radiusM } from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { Flow } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';

import { Button } from './Button';
import { Popup } from './Popup';
import { Icon } from './Icon';
import { Input } from './Input';

interface FlowCompletionProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    tabIndex?: React.ComponentProps<typeof Button>['tabIndex'];
    disabled?: React.ComponentProps<typeof Button>['disabled'];
    text: React.ComponentProps<typeof Button>['text'];
    query?: string;
    placeholder?: string;
    onClick?: (flow: Flow) => void;
}

const StyledItemCard = styled.div<{ focused?: boolean }>`
    padding: 6px;
    border: 1px solid ${gray7};
    border-radius: ${radiusM};
    min-width: 250px;
    margin-bottom: 4px;
    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        border-color: ${gray8};
        background-color: ${gray6};
    }

    ${({ focused }) =>
        focused &&
        css`
            border-color: ${gray8};
            background-color: ${gray6};
        `}
`;
const StyledItemInfo = styled.div`
    padding-left: 4px;
`;
const StyledItemTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
`;
const ItemCard: React.FC<{
    title?: string;
    states: Flow['states'];
    graph?: string;
    focused?: boolean;
    onClick?: () => void;
}> = ({ title, focused, onClick }) => {
    return (
        <StyledItemCard onClick={onClick} focused={focused}>
            <StyledItemInfo>
                <StyledItemTitle>{title}</StyledItemTitle>
            </StyledItemInfo>
        </StyledItemCard>
    );
};

const StyledDropdownContainer = styled.div``;

const fetcher = createFetcher((_, query: string) => ({
    flowCompletion: [
        {
            query,
        },
        {
            id: true,
            title: true,
            states: {
                id: true,
                title: true,
            },
        },
    ],
}));

export const FlowCompletion: React.FC<FlowCompletionProps> = ({
    size,
    text,
    view,
    tabIndex,
    disabled,
    onClick,
    query = '',
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
    const { data } = useSWR(inputState, (q) => fetcher(session?.user, q));

    const onClickOutside = useCallback(() => {
        setEditMode(false);
        setPopupVisibility(false);
        setInputState(query);
    }, [query]);

    const onButtonClick = useCallback(() => {
        setEditMode(true);
        setPopupVisibility(true);
    }, []);

    const onItemClick = useCallback(
        (flow: Flow) => () => {
            setEditMode(false);
            setPopupVisibility(false);
            onClick && onClick(flow);
            setInputState(flow.title);
        },
        [onClick],
    );

    const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputState(e.target.value);
    }, []);

    const [onESC] = useKeyboard(
        [KeyCode.Escape],
        () => {
            popupVisible && setPopupVisibility(false);
            setEditMode(false);
        },
        {
            stopPropagation: true,
        },
    );

    const [onENTER] = useKeyboard(
        [KeyCode.Enter],
        () => {
            if (data?.flowCompletion?.length) {
                onItemClick(data?.flowCompletion[cursor])();
                popupRef.current?.focus();
            }
        },
        {
            stopPropagation: true,
        },
    );

    useEffect(() => {
        const flowCompletion = data?.flowCompletion;

        if (flowCompletion?.length && downPress) {
            setCursor((prevState) => (prevState < flowCompletion.length - 1 ? prevState + 1 : prevState));
        }
    }, [data?.flowCompletion, downPress]);

    useEffect(() => {
        if (data?.flowCompletion?.length && upPress) {
            setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [data?.flowCompletion, upPress]);

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
                        disabled={disabled}
                        size={size}
                        view={view}
                        text={text}
                        iconLeft={<Icon type="flow" size="xs" />}
                        onClick={onButtonClick}
                        tabIndex={tabIndex}
                    />
                )}
            </StyledDropdownContainer>

            <Popup
                placement="top-start"
                overflow="hidden"
                visible={popupVisible && Boolean(data?.flowCompletion?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                <>
                    {data?.flowCompletion?.map((f, i) => (
                        <ItemCard
                            key={f.id}
                            title={f.title}
                            states={f.states}
                            graph={f.graph}
                            focused={cursor === i}
                            onClick={onItemClick(f)}
                        />
                    ))}
                </>
            </Popup>
        </>
    );
};
