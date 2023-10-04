import React from 'react';
import { Button, Dropdown, MenuItem } from '@taskany/bricks';

import { Priority, priorityVariants } from '../types/priority';
import { comboboxItem, priorityCombobox } from '../utils/domObjects';

import { getPriorityText } from './PriorityText/PriorityText';
import { CommonDropdown } from './CommonDropdown';

interface PriorityDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    value?: string | null;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];
    error?: React.ComponentProps<typeof Dropdown>['error'];

    onChange?: (priority: Priority) => void;
}

export const PriorityDropdown = React.forwardRef<HTMLDivElement, PriorityDropdownProps>(
    ({ text, value, disabled, error, onChange }, ref) => {
        return (
            <CommonDropdown
                ref={ref}
                error={error}
                text={value || text}
                value={value}
                onChange={onChange}
                items={Object.keys(priorityVariants)}
                disabled={disabled}
                renderTrigger={(props) => (
                    <Button
                        ref={props.ref}
                        onClick={props.onClick}
                        disabled={props.disabled}
                        text={getPriorityText(props.value)}
                        {...priorityCombobox.attr}
                    />
                )}
                renderItem={(props) => (
                    <MenuItem
                        ghost
                        key={props.item}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                        {...comboboxItem.attr}
                    >
                        {getPriorityText(props.item)}
                    </MenuItem>
                )}
            />
        );
    },
);
