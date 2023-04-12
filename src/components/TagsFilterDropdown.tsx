import React, { useCallback, useEffect, useState } from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';

import { Tag as TagModel } from '../../graphql/@generated/genql';

import { FiltersMenuItem } from './FiltersMenuItem';

interface TagsFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    value?: Array<string>;
    tags?: Array<TagModel | undefined>;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: string[]) => void;
}

export const TagsFilterDropdown: React.FC<TagsFilterDropdownProps> = React.forwardRef<
    HTMLDivElement,
    TagsFilterDropdownProps
>(({ text, tags, value, disabled, onChange }, ref) => {
    const [selected, setSelected] = useState(new Set(value));

    useEffect(() => {
        setSelected(new Set(value));
    }, [value]);

    const onTagClick = useCallback(
        (t: TagModel) => {
            selected.has(t.id) ? selected.delete(t.id) : selected.add(t.id);
            const newSelected = new Set(selected);
            setSelected(newSelected);

            onChange?.(Array.from(newSelected));
        },
        [onChange, selected],
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
                    active={Boolean(Array.from(selected).length)}
                    disabled={props.disabled}
                    onClick={props.onClick}
                >
                    {props.text}
                </FiltersMenuItem>
            )}
            renderItem={(props) => (
                <MenuItem ghost key={props.item.id} selected={selected.has(props.item.id)} onClick={props.onClick}>
                    {props.item.title}
                </MenuItem>
            )}
        />
    );
});
