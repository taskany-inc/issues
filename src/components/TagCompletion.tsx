import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

import { gray6, gray7, gray8, radiusM } from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { Tag as TagModel } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { gql } from '../utils/gql';

import { Popup } from './Popup';
import { Icon } from './Icon';
import { Tag } from './Tag';
import { Input } from './Input';

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
    border: 1px solid ${gray7};
    border-radius: ${radiusM};

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
const StyledTagInfo = styled.div`
    padding-left: 4px;
`;
const StyledTagTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
`;
const StyledTagColor = styled.div`
    width: 14px;
    height: 14px;

    border-radius: 100%;
`;
const TagCard: React.FC<{
    title: string;
    description?: string;
    focused?: boolean;
    onClick?: () => void;
}> = ({ title, description, focused, onClick }) => {
    return (
        <StyledTagCard onClick={onClick} focused={focused} title={description}>
            <StyledTagColor />
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
    const [inputState, setInputState] = useState('');
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState(0);

    const t = useTranslations('TagCompletion');
    const { data } = useSWR(inputState, (q) => fetcher(session?.user, q));

    const onClickOutside = useCallback(() => {
        setEditMode(false);
        setPopupVisibility(false);
        setInputState('');
    }, []);

    const onButtonClick = useCallback(() => {
        setEditMode(true);
    }, []);

    const onInputBlur = useCallback(() => {
        if (!popupVisible) {
            setEditMode(false);
        }
    }, [popupVisible]);

    const onItemClick = useCallback(
        (tag: TagModel) => () => {
            onClick && onClick(tag);
            setInputState('');
        },
        [onClick],
    );

    const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPopupVisibility(Boolean(e.target.value));
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
            if (data?.tagCompletion?.length) {
                onItemClick(data?.tagCompletion[cursor])();
            } else if (inputState === '') {
                setPopupVisibility(false);
                setEditMode(false);
            }
        },
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
                },
                {
                    id: true,
                    title: true,
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
    }, [inputState, onItemClick, session, t]);

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
                        autoFocus
                        placeholder={placeholder}
                        value={inputState}
                        onBlur={onInputBlur}
                        onChange={onInputChange}
                        {...onENTER}
                    />
                ) : (
                    <StyledIconContainer>
                        <Icon ref={buttonRef} type="tag" size="xs" onClick={onButtonClick} />
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
                                    focused={cursor === i}
                                    onClick={onItemClick(t)}
                                />
                            ))}
                    </>
                ) : (
                    <>
                        {inputState !== '' && (
                            <StyledNewTagForm>
                                <Tag title={inputState} onClick={createTag} />
                            </StyledNewTagForm>
                        )}
                    </>
                )}
            </Popup>
        </>
    );
};
