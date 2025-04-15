import { Text, Counter } from '@taskany/bricks/harmony';
import { useState, useEffect, ComponentProps, useCallback } from 'react';
import { nullable } from '@taskany/bricks';

import { trpc } from '../../utils/trpcClient';
import { Dropdown, DropdownTrigger, DropdownPanel, DropdownGuardedProps } from '../Dropdown/Dropdown';

import { tr } from './TagDropdown.i18n';

interface Tag {
    id: string;
    title: string;
}

type TagDropdownProps = {
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    value?: Tag[];
    query?: string;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    placement?: ComponentProps<typeof DropdownPanel>['placement'];
    onClose?: () => void;
} & DropdownGuardedProps<Tag>;

export const TagDropdown = ({
    query = '',
    value = [],
    placeholder,
    mode,
    placement,
    onChange,
    onClose,
    ...props
}: TagDropdownProps) => {
    const [inputState, setInputState] = useState(query);

    useEffect(() => {
        setInputState(query);
    }, [query]);

    const { data: suggestions } = trpc.tag.suggestions.useQuery({ query: inputState }, { staleTime: 0 });

    const handleClose = useCallback(() => {
        onClose?.();
        setInputState('');
    }, [onClose]);

    return (
        <Dropdown arrow onClose={handleClose}>
            <DropdownTrigger {...props}>
                {nullable(
                    mode === 'multiple' && value.length > 1,
                    () => (
                        <Counter count={value.length} />
                    ),
                    nullable(value, ([{ title }]) => (
                        <Text size="s" ellipsis title={title}>
                            {title}
                        </Text>
                    )),
                )}
            </DropdownTrigger>
            <DropdownPanel
                width={320}
                value={value}
                title={tr('Tags')}
                items={suggestions}
                placement={placement}
                mode={mode}
                selectable
                placeholder={placeholder}
                inputState={inputState}
                setInputState={setInputState}
                onChange={onChange}
                renderItem={(props) => (
                    <Text size="s" weight="semiBold" as="span">
                        {props.item.title}
                    </Text>
                )}
            />
        </Dropdown>
    );
};
