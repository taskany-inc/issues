import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

import { gapS, gapXs } from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { Tag as TagModel } from '../../graphql/@generated/genql';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { gql } from '../utils/gql';

import { Button } from './Button';
import { Popup } from './Popup';
import { Icon } from './Icon';
import { Tag } from './Tag';
import { Input } from './Input';

interface TagCompletionProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    disabled?: React.ComponentProps<typeof Button>['disabled'];
    text: React.ComponentProps<typeof Button>['text'];
    filter?: string[];
    placeholder?: string;

    onAdd?: (tag: TagModel) => void;
    onChange?: (title: string) => void;
}

const fetcher = createFetcher((_, query: string) => ({
    tagCompletion: [
        {
            query,
        },
        {
            id: true,
            title: true,
            description: true,
        },
    ],
}));

const StyledTags = styled.div`
    padding: ${gapXs} ${gapS};
`;

export const TagCompletion: React.FC<TagCompletionProps> = ({
    size,
    view,
    text,
    disabled,
    filter = [],
    placeholder,
    onAdd,
    onChange,
}) => {
    const { data: session } = useSession();
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [inputState, setInputState] = useState('');

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
            onAdd && onAdd(tag);
            setInputState('');
            setPopupVisibility(false);
            setEditMode(false);
        },
        [onAdd],
    );

    const onInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setPopupVisibility(Boolean(e.target.value));
            setInputState(e.target.value);
            onChange && onChange(e.target.value);
        },
        [onChange],
    );

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

    const createTag = useCallback(async () => {
        if (!session) return;

        const promise = gql.mutation({
            createTag: [
                {
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

    const [onENTER] = useKeyboard(
        [KeyCode.Enter],
        async () => {
            await createTag();
        },
        {
            stopPropagation: true,
        },
    );

    return (
        <>
            <span ref={popupRef} {...onESC}>
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
                    <Button
                        ref={buttonRef}
                        disabled={disabled}
                        size={size}
                        view={view}
                        text={text}
                        iconLeft={<Icon noWrap type="tag" size="xs" />}
                        onClick={onButtonClick}
                    />
                )}
            </span>

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
                <StyledTags>
                    {data?.tagCompletion?.length
                        ? data?.tagCompletion
                              // eslint-disable-next-line no-shadow
                              ?.filter((t) => !filter.includes(t.id))
                              // eslint-disable-next-line no-shadow
                              .map((t) => (
                                  <Tag
                                      key={t.id}
                                      title={t.title}
                                      description={t.description}
                                      onClick={onItemClick(t)}
                                  />
                              ))
                        : inputState !== '' && <Tag title={inputState} onClick={createTag} />}
                </StyledTags>
            </Popup>
        </>
    );
};
