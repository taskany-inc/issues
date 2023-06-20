import React from 'react';
import { Button, Dropdown, MenuItem } from '@taskany/bricks';

import { Priority, priorityVariants } from '../types/priority';

import { PriorityText, getPriorityText } from './PriorityText/PriorityText';

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
            <Dropdown
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
                    />
                )}
                renderItem={(props) => (
                    <MenuItem ghost key={props.item} focused={props.cursor === props.index} onClick={props.onClick}>
                        <PriorityText value={props.item} />
                    </MenuItem>
                )}
            />
        );
    },
);
