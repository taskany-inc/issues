import React from 'react';
import { Button, Dropdown, MenuItem } from '@taskany/bricks';

import { comboboxItem, priorityCombobox } from '../utils/domObjects';
import { trpc } from '../utils/trpcClient';
import { PriorityReturnType } from '../../trpc/inferredTypes';

import { getPriorityText } from './PriorityText/PriorityText';
import { CommonDropdown } from './CommonDropdown';

interface PriorityDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    value?: PriorityReturnType;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];
    error?: React.ComponentProps<typeof Dropdown>['error'];

    onChange?: (priority: PriorityReturnType) => void;
}

export const PriorityDropdown = React.forwardRef<HTMLDivElement, PriorityDropdownProps>(
    ({ text, value, disabled, error, onChange }, ref) => {
        const { data = [] } = trpc.priority.getAll.useQuery();

        return (
            <CommonDropdown
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
            />
        );
    },
);
