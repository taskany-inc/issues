import React, { useCallback, useEffect, useState } from 'react';
import { Dropdown } from '@taskany/bricks';

import { Estimate } from '../../graphql/@generated/genql';

import { FiltersMenuItem } from './FiltersMenuItem';
import { MenuItem } from './MenuItem';

interface EstimateFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    value?: string[];
    estimates: Estimate[];
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: string[]) => void;
}

const estimateToString = (estimate: Estimate) => `${estimate.q}/${estimate.y}`;

export const EstimateFilterDropdown: React.FC<EstimateFilterDropdownProps> = React.forwardRef<
    HTMLDivElement,
    EstimateFilterDropdownProps
>(({ text, estimates, value, disabled, onChange }, ref) => {
    const [selected, setSelected] = useState(new Set(value));

    useEffect(() => {
        setSelected(new Set(value));
    }, [value]);

    const onEstimateClick = useCallback(
        (e: Estimate) => {
            selected.has(estimateToString(e))
                ? selected.delete(estimateToString(e))
                : selected.add(estimateToString(e));
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
            onChange={onEstimateClick}
            items={estimates}
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
                <MenuItem
                    ghost
                    key={estimateToString(props.item)}
                    selected={selected.has(estimateToString(props.item))}
                    onClick={props.onClick}
                >
                    {estimateToString(props.item)}
                </MenuItem>
            )}
        />
    );
});
