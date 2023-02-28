import React from 'react';
import dynamic from 'next/dynamic';

import { FiltersMenuItem } from './FiltersMenuItem';
import { MenuItem } from './MenuItem';

const Dropdown = dynamic(() => import('./Dropdown'));

export const defaultLimit = 100;
const limitVariants = [defaultLimit, 20, 30, 50, 100];

interface LimitFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    value?: number;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (l: number) => void;
}

export const LimitFilterDropdown = React.forwardRef<HTMLDivElement, LimitFilterDropdownProps>(
    ({ text, value = defaultLimit, disabled, onChange }, ref) => (
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
                    active={value !== defaultLimit}
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
