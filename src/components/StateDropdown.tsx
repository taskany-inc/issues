import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useKeyboard, KeyCode } from '@geist-ui/core';
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
import { State } from '../../graphql/generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';

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
    const popupRef = useRef<any>();
    const buttonRef = useRef<any>();
    const [popupVisible, setPopupVisibility] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState(0);

    const onClickOutside = () => {
        setEditMode(false);
        setPopupVisibility(false);
    };

    const onButtonClick = () => {
        setEditMode(true);
        setPopupVisibility(true);
    };

    const { data } = useSWR(flowId, (id) => fetcher(session?.user, id));

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
            if (data?.flow?.states?.length) {
                onItemClick(data?.flow?.states[cursor])();
                popupRef.current?.focus();
            }
        },
        [KeyCode.Enter],
        {
            stopPropagation: true,
        },
    );

    const onItemClick = (state: State) => () => {
        setEditMode(false);
        setPopupVisibility(false);
        onClick && onClick(state);
    };

    useEffect(() => {
        if (data?.flow?.states?.length && downPress) {
            setCursor((prevState) => (prevState < data?.flow?.states?.length! - 1 ? prevState + 1 : prevState));
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
                    iconLeft={<Icon type="flow" size="xs" color={buttonIconColor} />}
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
