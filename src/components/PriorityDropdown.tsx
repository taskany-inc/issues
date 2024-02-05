import React from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { Button } from '@taskany/bricks/harmony';

import { combobox, comboboxItem, priorityCombobox } from '../utils/domObjects';
import { trpc } from '../utils/trpcClient';
import { Priority } from '../types/priority';

import { getPriorityText } from './PriorityText/PriorityText';

interface PriorityDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    value?: Priority;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];
    error?: React.ComponentProps<typeof Dropdown>['error'];

    onChange?: (priority: Priority) => void;
}

export const PriorityDropdown = React.forwardRef<
    HTMLDivElement,
    PriorityDropdownProps & React.HTMLAttributes<HTMLDivElement>
>(({ text, value, disabled, error, onChange }, ref) => {
    const { data = [] } = trpc.priority.getAll.useQuery();

    return (
        <Dropdown
            ref={ref}
            error={error}
            text={value?.title || text}
            value={value?.title}
            onChange={onChange}
            items={data}
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
                    key={props.item.id}
                    focused={props.cursor === props.index}
                    onClick={props.onClick}
                    {...comboboxItem.attr}
                >
                    {getPriorityText(props.item.title)}
                </MenuItem>
            )}
            {...combobox.attr}
        />
    );
});
