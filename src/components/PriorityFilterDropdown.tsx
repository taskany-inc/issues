import React, { useCallback } from 'react';
import { Dropdown } from '@taskany/bricks';

import { Priority, priorityColorsMap } from '../types/priority';
import { trPriority } from '../i18n/priority';

import { FiltersMenuItem } from './FiltersMenuItem';
import { ColorizedMenuItem } from './ColorizedMenuItem';

interface PriorityFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    priority?: Priority[];
    value?: Array<Priority>;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: Priority[]) => void;
}

export const PriorityFilterDropdown = React.forwardRef<HTMLDivElement, PriorityFilterDropdownProps>(
    ({ text, priority, value, disabled, onChange }, ref) => {
        const onPriorityClick = useCallback(
            (p: Priority) => {
                const selected = new Set(value);
                selected.has(p) ? selected.delete(p) : selected.add(p);
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
                onChange={onPriorityClick}
                items={priority}
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
                    <ColorizedMenuItem
                        key={props.item}
                        hue={priorityColorsMap[props.item as Priority]}
                        checked={value?.includes(props.item)}
                        onClick={props.onClick}
                    >
                        {trPriority(props.item as Priority)}
                    </ColorizedMenuItem>
                )}
            />
        );
    },
);
