import { KeyCode, nullable, useClickOutside, useKeyboard, useLatest } from '@taskany/bricks';
import { Button, Input, Text } from '@taskany/bricks/harmony';
import { IconAddSmallOutline, IconXSmallOutline } from '@taskany/icons';
import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';

import { TagObject } from '../../types/tag';
import { notifyPromise } from '../../utils/notifyPromise';
import { trpc } from '../../utils/trpcClient';
import { comboboxInput, tagsCombobox } from '../../utils/domObjects';
import { Dropdown, DropdownPanel, DropdownTrigger } from '../Dropdown/Dropdown';

import s from './TagComboBox.module.css';
import { tr } from './TagComboBox.i18n';

interface TagComboBoxProps {
    text?: string;
    disabled?: boolean;
    placeholder?: string;
    query?: string;
    value?: TagObject[];
    onChange?: (value: TagObject[]) => void;
}

export const TagComboBox = ({
    query = '',
    value = [],
    disabled,
    placeholder,
    text = tr('Add tag'),
    onChange,
    ...props
}: TagComboBoxProps) => {
    const comboboxRef = useRef<HTMLDivElement | null>(null);
    const [inputState, setInputState] = useState(query);
    const valueRef = useLatest(value);
    const inputStateRef = useLatest(inputState);

    const { data: suggestions } = trpc.tag.suggestions.useQuery(
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

    const setTags = useCallback(
        (tag: TagObject) => {
            const newTags: TagObject[] = [...valueRef.current, tag];

            onChange?.(newTags);
            setInputState('');
        },
        [onChange, valueRef],
    );

    const createTag = useCallback(async () => {
        const promise = createMutation.mutateAsync({ title: inputStateRef.current });

        const [res] = await notifyPromise(promise, 'tagCreate');

        if (res) setTags(res);
    }, [createMutation, inputStateRef, setTags]);

    const onTagClick = useCallback(
        async (tag: TagObject) => {
            if (!suggestions?.length) {
                await createTag();
                return;
            }

            setTags(tag);
        },
        [suggestions, setTags, createTag],
    );

    const filterIds = useMemo(() => value?.map((t) => t.id), [value]);
    // eslint-disable-next-line no-nested-ternary
    const items = suggestions?.length
        ? suggestions.filter((t) => !filterIds.includes(t.id))
        : inputState !== ''
        ? [
              {
                  id: inputState,
                  title: inputState,
              },
          ]
        : [];

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setInputState(e.target.value);
    }, []);

    const [isOpen, setIsOpen] = useState(false);

    const onClose = useCallback(() => {
        setIsOpen(false);
        setInputState('');
    }, []);

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        onClose();
    });

    useClickOutside(comboboxRef, (e) => {
        if (comboboxRef.current?.contains(e.target as Node)) return;
        onClose();
    });

    return (
        <div className={s.TagComboBox} ref={comboboxRef} {...props}>
            <Dropdown isOpen={isOpen} onClose={onClose} arrow>
                <DropdownTrigger
                    renderTrigger={(props) => (
                        <>
                            {nullable(props.isOpen, () => (
                                <Input
                                    placeholder={placeholder}
                                    disabled={disabled}
                                    outline
                                    size="xs"
                                    value={inputState}
                                    autoFocus
                                    onChange={handleInputChange}
                                    ref={props.ref}
                                    {...(isOpen ? onESC : {})}
                                    {...comboboxInput.attr}
                                />
                            ))}
                            <Button
                                text={props.isOpen ? tr('Cancel') : text}
                                size="xs"
                                view="ghost"
                                iconLeft={!props.isOpen && <IconAddSmallOutline size="s" />}
                                iconRight={props.isOpen && <IconXSmallOutline size="s" />}
                                onClick={() => {
                                    props.onClick();
                                    setIsOpen(true);
                                }}
                                {...tagsCombobox.attr}
                            />
                        </>
                    )}
                />
                <DropdownPanel
                    visible={Boolean(items.length) && Boolean(inputState.length)}
                    items={items}
                    width={150}
                    onChange={onTagClick}
                    renderItem={(props) => <Text size="xs">{props.item.title}</Text>}
                />
            </Dropdown>
        </div>
    );
};
