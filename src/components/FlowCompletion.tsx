import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { Input, useInput, useKeyboard, KeyCode } from '@geist-ui/core';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { Button } from './Button';
import { Popup } from './Popup';
import { Icon } from './Icon';
import {
    buttonBackgroundColorHover,
    buttonBorderColor,
    buttonBorderColorHover,
    buttonIconColor,
} from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { Flow } from '../../graphql/generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';

interface FlowCompletionProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    disabled?: React.ComponentProps<typeof Button>['disabled'];
    text: React.ComponentProps<typeof Button>['text'];
    query?: string;
    placeholder?: string;
    onClick?: (flow: Flow) => void;
}

const StyledItemCard = styled.div<{ focused?: boolean }>`
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
}> = ({ title, states, graph, focused, onClick }) => {
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
    disabled,
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

    const { data } = useSWR(inputState, (query) => fetcher(session?.user, query));

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
            if (data?.flowCompletion?.length) {
                onItemClick(data?.flowCompletion[cursor])();
                popupRef.current?.focus();
            }
        },
        [KeyCode.Enter],
        {
            stopPropagation: true,
        },
    );

    const onItemClick = (flow: Flow) => () => {
        setEditMode(false);
        setPopupVisibility(false);
        onClick && onClick(flow);
        setInputState(flow.title);
    };

    useEffect(() => {
        if (data?.flowCompletion?.length && downPress) {
            setCursor((prevState) => (prevState < data?.flowCompletion?.length! - 1 ? prevState + 1 : prevState));
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
                    <Input placeholder={placeholder} scale={0.8} autoFocus {...onInput} {...onENTER} />
                ) : (
                    <Button
                        ref={buttonRef}
                        disabled={disabled}
                        size={size}
                        view={view}
                        text={text}
                        iconLeft={<Icon type="flow" size="xs" color={buttonIconColor} />}
                        onClick={onButtonClick}
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
