import React, { useCallback } from 'react';
import { Dropdown } from '@taskany/bricks';

import { State } from '../../graphql/@generated/genql';

import { FiltersMenuItem } from './FiltersMenuItem';
import { ColorizedMenuItem } from './ColorizedMenuItem';

interface StateFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    states?: State[];
    value?: Array<string>;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: string[]) => void;
}

export const StateFilterDropdown = React.forwardRef<HTMLDivElement, StateFilterDropdownProps>(
    ({ text, states, value, disabled, onChange }, ref) => {
        const onStateClick = useCallback(
            (s: State) => {
                const selected = new Set(value);
                selected.has(s.id) ? selected.delete(s.id) : selected.add(s.id);
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
                onChange={onStateClick}
                items={states}
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
                        key={props.item.id}
                        hue={props.item.hue}
                        checked={value?.includes(props.item.id)}
                        onClick={props.onClick}
                    >
                        {props.item.title}
                    </ColorizedMenuItem>
                )}
            />
        );
    },
);
