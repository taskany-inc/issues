import React, { useCallback } from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';

import { FiltersMenuItem } from './FiltersMenuItem';

interface TagObject {
    id: string;
    title: string;
    description?: string | null;
}

interface TagsFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    value?: Array<string>;
    tags?: Array<TagObject>;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: string[]) => void;
}

export const TagsFilterDropdown: React.FC<TagsFilterDropdownProps> = React.forwardRef<
    HTMLDivElement,
    TagsFilterDropdownProps
>(({ text, tags, value, disabled, onChange }, ref) => {
    const onTagClick = useCallback(
        (t: TagObject) => {
            const selected = new Set(value);
            selected.has(t.id) ? selected.delete(t.id) : selected.add(t.id);
            const newSelected = new Set(selected);

            onChange?.(Array.from(newSelected));
        },
        [onChange, value],
    );

    return (
        <Dropdown
            ref={ref}
            text={text}
            value={value}
            onChange={onTagClick}
            items={tags}
            disabled={disabled}
            renderTrigger={(props) => (
                <FiltersMenuItem
                    ref={props.ref}
                    active={Boolean(value?.length)}
                    disabled={props.disabled}
                    onClick={props.onClick}
                >
                    {props.text}
                </FiltersMenuItem>
            )}
            renderItem={(props) => (
                <MenuItem ghost key={props.item.id} selected={value?.includes(props.item.id)} onClick={props.onClick}>
                    {props.item.title}
                </MenuItem>
            )}
        />
    );
});
