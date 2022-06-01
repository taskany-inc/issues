import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { Input, useInput, useKeyboard, KeyCode } from '@geist-ui/core';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

import {
    buttonBackgroundColorHover,
    buttonBorderColor,
    buttonBorderColorHover,
    buttonIconColor,
    buttonOutlineTextColor,
} from '../design/@generated/themes';
import { backgroundColor as darkBackgroundColor } from '../design/@generated/themes/dark.constants';
import { backgroundColor as lightBackgroundColor } from '../design/@generated/themes/light.constants';
import { createFetcher } from '../utils/createFetcher';
import { Tag as TagModel } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { randomHex } from '../utils/randomHex';
import { gql } from '../utils/gql';

import { Popup } from './Popup';
import { Icon } from './Icon';
import { Tag } from './Tag';

interface TagCompletionProps {
    filter?: string[];
    placeholder?: string;
    onClick?: (user: TagModel) => void;
}

const StyledTagCard = styled.div<{ focused?: boolean }>`
    display: grid;
    grid-template-columns: 2fr 10fr;
    justify-content: center;
    align-items: center;
    min-width: 185px;

    padding: 6px;
    margin-bottom: 4px;
    border: 1px solid ${buttonBorderColor};
    border-radius: 6px;

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
            <StyledTagColor color={color} />
            <StyledTagInfo>
                <StyledTagTitle>{title}</StyledTagTitle>
            </StyledTagInfo>
        </StyledTagCard>
    );
};

const StyledDropdownContainer = styled.div``;

const StyledIconContainer = styled.div`
    padding: 6px 2px;
`;

const StyledNewTagForm = styled.div`
    display: grid;
    grid-template-columns: 8fr 4fr;
    justify-content: center;
    align-items: center;
`;
const StyledNewTagInfo = styled.div`
    font-size: 12px;
    font-weight: 600;
    color: ${buttonOutlineTextColor};
    padding: 2px 4px;
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

export const TagCompletion: React.FC<TagCompletionProps> = ({ onClick, filter = [], placeholder }) => {
    const { data: session } = useSession();
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const { state: inputState, reset: inputReset, bindings: inputBingings } = useInput('');
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState(0);
    const [color, setColor] = useState(buttonBorderColor);
    const updateColor = useCallback(() => {
        const newColor = randomHex([darkBackgroundColor, lightBackgroundColor]);

        if (newColor) {
            setColor(newColor);
        }
    }, []);
    const t = useTranslations('TagCompletion');
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

    const onItemClick = (tag: TagModel) => () => {
        onClick && onClick(tag);
        inputReset();
    };

    const onInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setPopupVisibility(Boolean(e.target.value));
            inputBingings.onChange(e);
        },
        [inputBingings],
    );

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

    const createTag = useCallback(async () => {
        if (!session) return;

        const promise = gql.mutation({
            createTag: [
                {
                    user: session.user,
                    title: inputState,
                    color,
                },
                {
                    id: true,
                    title: true,
                    description: true,
                    color: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating new tag'),
            success: t('Voila! Tag is here 🎉'),
        });

        const res = await promise;

        res.createTag && onItemClick(res.createTag as TagModel)();
        setPopupVisibility(false);
        setEditMode(false);
        updateColor();
    }, [color, inputState, onItemClick, session, t, updateColor]);

    useEffect(updateColor, [updateColor]);

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
                        {...inputBingings}
                        onBlur={onInputBlur}
                        onChange={onInputChange}
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
                {data?.tagCompletion?.length ? (
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
                ) : (
                    <>
                        {inputState !== '' && (
                            <StyledNewTagForm>
                                <StyledNewTagInfo>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            updateColor();
                                        }}
                                    >
                                        {t('Click here')}
                                    </a>{' '}
                                    {t('Change color and create')}
                                </StyledNewTagInfo>

                                <Tag color={color} title={inputState} onClick={createTag} />
                            </StyledNewTagForm>
                        )}
                    </>
                )}
            </Popup>
        </>
    );
};
