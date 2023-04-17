import React, { useCallback, useState } from 'react';
import { Dropdown } from '@taskany/bricks';

import { usePageContext } from '../hooks/usePageContext';
import { Priority, priorityColorsMap } from '../types/priority';
import { trPriority } from '../i18n/priority';

import { FiltersMenuItem } from './FiltersMenuItem';
import { ColorizedMenuItem } from './ColorizedMenuItem';

interface PriorityFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    priority?: string[];
    value?: Array<string>;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: string[]) => void;
}

export const PriorityFilterDropdown = React.forwardRef<HTMLDivElement, PriorityFilterDropdownProps>(
    ({ text, priority, value, disabled, onChange }, ref) => {
        const { themeId } = usePageContext();
        const [selected, setSelected] = useState<Set<string>>(new Set(value));

        const onPriorityClick = useCallback(
            (p: Priority) => {
                selected.has(p) ? selected.delete(p) : selected.add(p);
                const newSelected = new Set(selected);
                setSelected(newSelected);

                onChange?.(Array.from(newSelected));
            },
            [onChange, selected],
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
                        active={Boolean(Array.from(selected).length)}
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
                        checked={selected?.has(props.item)}
                        onClick={props.onClick}
                    >
                        {trPriority(props.item as Priority)}
                    </ColorizedMenuItem>
                )}
            />
        );
    },
);
