import React from 'react';
import { Button, Dropdown } from '@taskany/bricks';

import { usePageContext } from '../hooks/usePageContext';
import { Priority, priorityColorsMap } from '../types/priority';
import { trPriority } from '../i18n/priority';

import { StateDot } from './StateDot';
import { ColorizedMenuItem } from './ColorizedMenuItem';

interface PriorityDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    value?: string | null;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];
    error?: React.ComponentProps<typeof Dropdown>['error'];

    onChange?: (priority: Priority) => void;
}

export const PriorityDropdown = React.forwardRef<HTMLDivElement, PriorityDropdownProps>(
    ({ text, value, disabled, error, onChange }, ref) => {
        const priorityVariants = Object.keys(priorityColorsMap) as Priority[];

        return (
            <Dropdown
                ref={ref}
                error={error}
                text={value || text}
                value={value}
                onChange={onChange}
                items={priorityVariants}
                disabled={disabled}
                renderTrigger={(props) => (
                    <Button
                        ref={props.ref}
                        onClick={props.onClick}
                        disabled={props.disabled}
                        iconLeft={<StateDot hue={priorityColorsMap[props.value as Priority]} />}
                    />
                )}
                renderItem={(props) => (
                    <ColorizedMenuItem
                        key={props.item}
                        hue={priorityColorsMap[props.item as Priority]}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                    >
                        {trPriority(props.item as Priority)}
                    </ColorizedMenuItem>
                )}
            />
        );
    },
);
