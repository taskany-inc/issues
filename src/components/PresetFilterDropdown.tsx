import React, { useCallback } from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { Filter } from '@prisma/client';

import { FilterById } from '../../trpc/inferredTypes';

import { FiltersMenuItem } from './FiltersMenuItem';

interface PresetFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    presets: Filter[];
    value?: string;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: string | undefined) => void;
}

export const PresetFilterDropdown: React.FC<PresetFilterDropdownProps> = React.forwardRef<
    HTMLDivElement,
    PresetFilterDropdownProps
>(({ text, presets, value, disabled, onChange }, ref) => {
    const onPresetClick = useCallback(
        (p: FilterById) => {
            const newSelected = value === p.id ? undefined : p.id;

            onChange?.(newSelected);
        },
        [onChange, value],
    );

    return (
        <Dropdown
            ref={ref}
            text={text}
            value={value}
            onChange={onPresetClick}
            items={presets}
            disabled={disabled}
            renderTrigger={(props) => (
                <FiltersMenuItem
                    ref={props.ref}
                    active={Boolean(value)}
                    disabled={props.disabled}
                    onClick={props.onClick}
                >
                    {props.text}
                </FiltersMenuItem>
            )}
            renderItem={(props) => (
                <MenuItem ghost key={props.item.id} selected={value === props.item.id} onClick={props.onClick}>
                    {props.item.title}
                </MenuItem>
            )}
        />
    );
});
