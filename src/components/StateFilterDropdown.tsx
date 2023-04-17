import React, { useCallback, useState } from 'react';
import { Dropdown } from '@taskany/bricks';

import { State } from '../../graphql/@generated/genql';
import { usePageContext } from '../hooks/usePageContext';

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
        const { themeId } = usePageContext();
        const [selected, setSelected] = useState<Set<string>>(new Set(value));

        const onStateClick = useCallback(
            (s: State) => {
                selected.has(s.id) ? selected.delete(s.id) : selected.add(s.id);
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
                onChange={onStateClick}
                items={states}
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
                        key={props.item.id}
                        hue={props.item.hue}
                        checked={selected?.has(props.item.id)}
                        onClick={props.onClick}
                    >
                        {props.item.title}
                    </ColorizedMenuItem>
                )}
            />
        );
    },
);
