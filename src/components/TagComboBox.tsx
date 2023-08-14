/* eslint-disable no-nested-ternary */
import React, { useCallback, useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { Button, ComboBox, Input, Tag, TagIcon } from '@taskany/bricks';

import { trpc } from '../utils/trpcClient';
import { notifyPromise } from '../utils/notifyPromise';

interface TagObject {
    id: string;
    title: string;
    description?: string | null;
}

interface TagComboBoxProps {
    text?: React.ComponentProps<typeof Button>['text'];
    query?: string;
    value?: TagObject[];
    disabled?: boolean;
    placeholder?: string;
    error?: React.ComponentProps<typeof ComboBox>['error'];

    onChange?: (value: TagObject[]) => void;
}

const StyledInput = styled(Input)`
    min-width: 100px;
`;

export const TagComboBox = React.forwardRef<HTMLDivElement, TagComboBoxProps>(
    ({ text, value = [], query = '', error, disabled, placeholder, onChange }, ref) => {
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(query);
        const [tags, setTags] = useState(value);

        const suggestions = trpc.tag.suggestions.useQuery({
            query: inputState,
        });
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
                renderTrigger={(props) => (
                    <Button
                        text={props.text}
                        disabled={props.disabled}
                        onClick={props.onClick}
                        iconLeft={<TagIcon noWrap size="xs" />}
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
                        description={props.item.description}
                        onClick={suggestions.data?.length ? props.onClick : createTag}
                    >
                        {props.item.title}
                    </Tag>
                )}
            />
        );
    },
);
