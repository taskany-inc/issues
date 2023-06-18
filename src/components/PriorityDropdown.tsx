import React, { useMemo } from 'react';
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
        const items = useMemo(() => Object.keys(priorityVariants).map((p) => getPriorityText(p as Priority)), []);

        return (
            <Dropdown
                ref={ref}
                error={error}
                text={value || text}
                value={value}
                onChange={onChange}
                items={items}
                disabled={disabled}
                renderTrigger={(props) => (
                    <Button ref={props.ref} onClick={props.onClick} disabled={props.disabled} text={props.value} />
                )}
                renderItem={(props) => (
                    <MenuItem ghost key={props.item.id} focused={props.cursor === props.index} onClick={props.onClick}>
                        <PriorityText value={props.item} />
                    </MenuItem>
                )}
            />
        );
    },
);
