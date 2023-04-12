import React from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';

import { FiltersMenuItem } from './FiltersMenuItem';

const limitVariants = [10, 20, 30, 50, 100];

interface LimitFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    value?: number;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (l: number) => void;
}

export const LimitFilterDropdown = React.forwardRef<HTMLDivElement, LimitFilterDropdownProps>(
    ({ text, value, disabled, onChange }, ref) => (
        <Dropdown
            ref={ref}
            text={text}
            value={value}
            onChange={onChange}
            items={limitVariants}
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
                <MenuItem
                    key={props.item}
                    focused={props.cursor === props.index}
                    selected={props.item === value}
                    onClick={props.onClick}
                >
                    {props.item}
                </MenuItem>
            )}
        />
    ),
);
