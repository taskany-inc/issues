import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { gray6, gray7, gray8 } from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { State } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';

import { Button } from './Button';
import { Popup } from './Popup';
import { Icon } from './Icon';

interface StateDropdownProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    disabled?: React.ComponentProps<typeof Button>['disabled'];
    text: React.ComponentProps<typeof Button>['text'];
    flowId?: string;
    onClick?: (state: State) => void;
}

const StyledItemCard = styled.div<{ focused?: boolean }>`
    padding: 6px;
    border: 1px solid ${gray7};
    border-radius: 6px;
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

const fetcher = createFetcher((_, id: string) => ({
    flow: [
        {
            id,
        },
        {
            id: true,
            title: true,
            states: {
                id: true,
                title: true,
                default: true,
            },
        },
    ],
}));

export const StateDropdown: React.FC<StateDropdownProps> = ({ size, text, view, flowId, disabled, onClick }) => {
    const { data: session } = useSession();
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState(0);
    const { data } = useSWR(flowId, (id) => fetcher(session?.user, id));

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(true);
    }, []);

    const onItemClick = useCallback(
        (state: State) => () => {
            setPopupVisibility(false);
            onClick && onClick(state);
        },
        [onClick],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => popupVisible && setPopupVisibility(false), {
        stopPropagation: true,
    });

    const [onENTER] = useKeyboard(
        [KeyCode.Enter],
        () => {
            if (data?.flow?.states?.length) {
                onItemClick(data?.flow?.states[cursor])();
                popupRef.current?.focus();
            }
        },
        {
            stopPropagation: true,
        },
    );

    useEffect(() => {
        const states = data?.flow?.states;

        if (states?.length && downPress) {
            setCursor((prevState) => (prevState < states.length - 1 ? prevState + 1 : prevState));
        }
    }, [data?.flow, downPress]);

    useEffect(() => {
        if (data?.flow?.states?.length && upPress) {
            setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [data?.flow, upPress]);

    return (
        <>
            <StyledDropdownContainer ref={popupRef} {...onESC} {...onENTER}>
                <Button
                    ref={buttonRef}
                    disabled={disabled}
                    size={size}
                    view={view}
                    text={text}
                    iconLeft={<Icon type="flow" size="xs" />}
                    onClick={onButtonClick}
                />
            </StyledDropdownContainer>

            <Popup
                placement="top-start"
                overflow="hidden"
                visible={popupVisible && Boolean(data?.flow?.states?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                <>
                    {data?.flow?.states?.map((s, i) => (
                        <ItemCard key={s.id} title={s.title} focused={cursor === i} onClick={onItemClick(s)} />
                    ))}
                </>
            </Popup>
        </>
    );
};
