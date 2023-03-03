import React, { useCallback, useMemo, useState } from 'react';
import colorLayer from 'color-layer';
import dynamic from 'next/dynamic';

import { State } from '../../graphql/@generated/genql';
import { usePageContext } from '../hooks/usePageContext';

import { ColorizedMenuItem } from './ColorizedMenuItem';
import { FiltersMenuItem } from './FiltersMenuItem';

const Dropdown = dynamic(() => import('./Dropdown'));

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

        const colors = useMemo(
            () => states?.map((f) => colorLayer(f.hue, 5, f.hue === 1 ? 0 : undefined)[themeId]) || [],
            [themeId, states],
        );

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
                        title={props.item.title}
                        hoverColor={colors[props.index]}
                        checked={selected?.has(props.item.id)}
                        onClick={props.onClick}
                    />
                )}
            />
        );
    },
);
