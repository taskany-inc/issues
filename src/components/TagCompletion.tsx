import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { Input, useInput, Grid, useKeyboard, KeyCode } from '@geist-ui/core';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import {
    buttonBackgroundColorHover,
    buttonBorderColor,
    buttonBorderColorHover,
    buttonIconColor,
} from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { Tag } from '../../graphql/generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';

import { Popup } from './Popup';
import { Icon } from './Icon';

interface TagCompletionProps {
    query?: string;
    filter?: string[];
    placeholder?: string;
    onClick?: (user: Tag) => void;
}

const StyledTagCard = styled.div<{ focused?: boolean }>`
    padding: 6px;
    border: 1px solid ${buttonBorderColor};
    border-radius: 6px;
    min-width: 185px;
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
const StyledTagInfo = styled.div`
    padding-left: 4px;
`;
const StyledTagTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
`;
const StyledTagColor = styled.div<{ color: string }>`
    width: 14px;
    height: 14px;

    border-radius: 100%;

    ${({ color }) => css`
        background-color: ${color};
    `}
`;
const TagCard: React.FC<{
    title: string;
    description?: string;
    color: string;
    focused?: boolean;
    onClick?: () => void;
}> = ({ title, description, color, focused, onClick }) => {
    return (
        <StyledTagCard onClick={onClick} focused={focused} title={description}>
            <Grid.Container gap={0}>
                <Grid xs={3} alignItems="center" justify="center">
                    <StyledTagColor color={color} />
                </Grid>
                <Grid xs={21} alignItems="center">
                    <StyledTagInfo>
                        <StyledTagTitle>{title}</StyledTagTitle>
                    </StyledTagInfo>
                </Grid>
            </Grid.Container>
        </StyledTagCard>
    );
};

const StyledDropdownContainer = styled.div``;

const StyledIconContainer = styled.div`
    padding: 6px 2px;
`;

const fetcher = createFetcher((_, query: string) => ({
    tagCompletion: [
        {
            query,
        },
        {
            id: true,
            title: true,
            description: true,
            color: true,
        },
    ],
}));

export const TagCompletion: React.FC<TagCompletionProps> = ({ onClick, query = '', filter = [], placeholder }) => {
    const { data: session } = useSession();
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const { state: inputState, reset: inputReset, bindings: onInput } = useInput(query);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState(0);
    const { data } = useSWR(inputState, (q) => fetcher(session?.user, q));

    const onClickOutside = useCallback(() => {
        setEditMode(false);
        setPopupVisibility(false);
        inputReset();
    }, [inputReset]);

    const onButtonClick = useCallback(() => {
        setEditMode(true);
    }, []);

    const onInputBlur = useCallback(() => {
        if (!popupVisible) {
            setEditMode(false);
        }
    }, [popupVisible]);

    const onItemClick = (tag: Tag) => () => {
        onClick && onClick(tag);
        inputReset();
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
            if (data?.tagCompletion?.length) {
                onItemClick(data?.tagCompletion[cursor])();
            } else if (inputState === '') {
                setPopupVisibility(false);
                setEditMode(false);
            }
        },
        [KeyCode.Enter],
        {
            stopPropagation: true,
        },
    );

    useEffect(() => {
        if (data?.tagCompletion?.length) {
            setPopupVisibility(true);
        }
    }, [data?.tagCompletion]);

    useEffect(() => {
        const tagCompletion = data?.tagCompletion;

        if (tagCompletion?.length && downPress) {
            setCursor((prevState) => (prevState < tagCompletion.length - 1 ? prevState + 1 : prevState));
        }
    }, [data?.tagCompletion, downPress]);

    useEffect(() => {
        if (data?.tagCompletion?.length && upPress) {
            setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [data?.tagCompletion, upPress]);

    return (
        <>
            <StyledDropdownContainer ref={popupRef} {...onESC}>
                {editMode ? (
                    <Input
                        placeholder={placeholder}
                        scale={0.8}
                        autoFocus
                        icon={
                            // FIXME: https://github.com/taskany-inc/goals/issues/14
                            <span style={{ display: 'inline-block', position: 'relative', top: '1px' }}>
                                <Icon type="tag" size="xs" color={buttonIconColor} />
                            </span>
                        }
                        onBlur={onInputBlur}
                        {...onInput}
                        {...onENTER}
                    />
                ) : (
                    <StyledIconContainer>
                        <Icon ref={buttonRef} type="tag" size="xs" color={buttonIconColor} onClick={onButtonClick} />
                    </StyledIconContainer>
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
                <>
                    {data?.tagCompletion
                        ?.filter((t) => !filter.includes(t.id))
                        .map((t, i) => (
                            <TagCard
                                key={t.id}
                                title={t.title}
                                description={t.description}
                                color={t.color}
                                focused={cursor === i}
                                onClick={onItemClick(t)}
                            />
                        ))}
                </>
            </Popup>
        </>
    );
};
