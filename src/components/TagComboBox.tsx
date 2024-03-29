/* eslint-disable no-nested-ternary */
import React, { useCallback, useState, ChangeEvent } from 'react';
import { ComboBox, Tag } from '@taskany/bricks';
import { IconTagOutline } from '@taskany/icons';
import { Button, FormControl, FormControlInput } from '@taskany/bricks/harmony';

import { trpc } from '../utils/trpcClient';
import { notifyPromise } from '../utils/notifyPromise';
import { comboboxInput, comboboxItem, tagsCombobox } from '../utils/domObjects';
import { TagObject } from '../types/tag';

import { TagsList } from './TagsList/TagsList';

interface TagComboBoxProps {
    text?: React.ComponentProps<typeof Button>['text'];
    query?: string;
    value?: TagObject[];
    disabled?: boolean;
    placeholder?: string;
    error?: React.ComponentProps<typeof ComboBox>['error'];

    onChange?: (value: TagObject[]) => void;
    renderTrigger?: React.ComponentProps<typeof ComboBox>['renderTrigger'] & React.HTMLAttributes<HTMLElement>;
}

export const TagComboBox = React.forwardRef<
    HTMLDivElement,
    TagComboBoxProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>
>(({ text, value = [], query = '', error, disabled, placeholder, onChange, renderTrigger, ...attrs }, ref) => {
    const [completionVisible, setCompletionVisibility] = useState(false);
    const [inputState, setInputState] = useState(query);
    const [tags, setTags] = useState(value);

    const suggestions = trpc.tag.suggestions.useQuery(
        {
            query: inputState,
        },
        {
            enabled: inputState.length >= 3,
            cacheTime: 0,
            staleTime: 0,
        },
    );
    const createMutation = trpc.tag.create.useMutation();

    const createTag = useCallback(async () => {
        const promise = createMutation.mutateAsync({ title: inputState });

        const [res] = await notifyPromise(promise, 'tagCreate');

        if (res) {
            const newTags = [...tags, res];
            setTags(newTags);
            onChange?.(newTags);
            setInputState('');
            setCompletionVisibility(false);
        }
    }, [inputState, onChange, tags, createMutation]);

    const onTagClick = useCallback(
        async (tag: TagObject) => {
            if (!suggestions.data?.length) {
                await createTag();
                return;
            }
            const newTags = [...value, tag];
            setTags(newTags);
            onChange?.(newTags);
            setInputState('');
        },
        [onChange, value, suggestions.data, createTag],
    );

    const filterIds = value.map((t) => t.id);
    const items = suggestions.data?.length
        ? suggestions.data?.filter((t) => !filterIds.includes(t.id))
        : inputState !== ''
        ? [
              {
                  id: inputState,
                  title: inputState,
              },
          ]
        : [];

    const onClickOutside = useCallback((cb: () => void) => cb(), []);

    return (
        <ComboBox
            ref={ref}
            text={text}
            value={inputState}
            visible={completionVisible}
            error={error}
            disabled={disabled}
            onClickOutside={onClickOutside}
            onChange={onTagClick}
            items={items}
            renderTrigger={(props) =>
                renderTrigger ? (
                    renderTrigger({ ...props, ...tagsCombobox.attr })
                ) : (
                    <Button
                        text={props.text}
                        disabled={props.disabled}
                        onClick={props.onClick}
                        iconLeft={<IconTagOutline size="xs" />}
                        {...tagsCombobox.attr}
                    />
                )
            }
            renderInput={(props) => (
                <FormControl>
                    <FormControlInput
                        outline
                        autoFocus
                        disabled={props.disabled}
                        placeholder={placeholder}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setInputState(e.currentTarget.value);
                            setCompletionVisibility(true);
                        }}
                        {...comboboxInput.attr}
                        {...props}
                    />
                </FormControl>
            )}
            renderItems={(children) => <TagsList>{children}</TagsList>}
            renderItem={(props) => (
                <Tag
                    key={props.item.id}
                    onClick={suggestions.data?.length ? props.onClick : createTag}
                    {...comboboxItem.attr}
                >
                    {props.item.title}
                </Tag>
            )}
            {...attrs}
        />
    );
});
