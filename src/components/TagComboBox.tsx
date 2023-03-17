/* eslint-disable no-nested-ternary */
import React, { useCallback, useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

import { Button } from '@common/Button';
import { Icon } from '@common/Icon';
import { Tag } from '@common/Tag';
import { Input } from '@common/Input';

import { createFetcher } from '../utils/createFetcher';
import { Tag as TagModel } from '../../graphql/@generated/genql';
import { gql } from '../utils/gql';
import { usePageContext } from '../hooks/usePageContext';

const ComboBox = dynamic(() => import('@common/ComboBox'));

interface TagComboBoxProps {
    text?: React.ComponentProps<typeof Button>['text'];
    query?: string;
    value?: Array<Partial<TagModel>>;
    disabled?: boolean;
    placeholder?: string;
    error?: React.ComponentProps<typeof ComboBox>['error'];

    onChange?: (value: Array<Partial<TagModel>>) => void;
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

const StyledInput = styled(Input)`
    min-width: 100px;
`;

export const TagComboBox = React.forwardRef<HTMLDivElement, TagComboBoxProps>(
    ({ text, value = [], query = '', error, disabled, placeholder, onChange }, ref) => {
        const { user } = usePageContext();
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(query);
        const [tags, setTags] = useState(value);

        const t = useTranslations('TagCompletion');
        const { data } = useSWR(inputState, (q) => fetcher(user, q));

        const createTag = useCallback(async () => {
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

            if (res.createTag) {
                const newTags = [...tags, res.createTag as TagModel];
                setTags(newTags);
                onChange?.(newTags);
                setInputState('');
                setCompletionVisibility(false);
            }
        }, [inputState, onChange, t, tags]);

        const onTagClick = useCallback(
            async (tag: TagModel) => {
                if (!data?.tagCompletion?.length) {
                    await createTag();
                    return;
                }
                const newTags = [...tags, tag];
                setTags(newTags);
                onChange?.(newTags);
                setInputState('');
            },
            [onChange, tags, data?.tagCompletion, createTag],
        );

        const filterIds = value.map((t) => t.id);
        const items = data?.tagCompletion?.length
            ? data?.tagCompletion?.filter((t) => !filterIds.includes(t.id))
            : inputState !== ''
            ? [
                  {
                      id: inputState,
                      title: inputState,
                  },
              ]
            : [];

        return (
            <ComboBox
                ref={ref}
                text={text}
                value={inputState}
                visible={completionVisible}
                error={error}
                disabled={disabled}
                onChange={onTagClick}
                items={items}
                renderTrigger={(props) => (
                    <Button
                        ref={props.ref}
                        text={props.text}
                        disabled={props.disabled}
                        onClick={props.onClick}
                        iconLeft={<Icon noWrap type="tag" size="xs" />}
                    />
                )}
                renderInput={(props) => (
                    <StyledInput
                        autoFocus
                        disabled={props.disabled}
                        placeholder={placeholder}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setInputState(e.currentTarget.value);
                            setCompletionVisibility(true);
                        }}
                        {...props}
                    />
                )}
                renderItem={(props) => (
                    <Tag
                        key={props.item.id}
                        title={props.item.title}
                        description={props.item.description}
                        onClick={data?.tagCompletion?.length ? props.onClick : createTag}
                    />
                )}
            />
        );
    },
);
