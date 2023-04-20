import React, { useCallback } from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';

import { Estimate } from '../../graphql/@generated/genql';

import { FiltersMenuItem } from './FiltersMenuItem';

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
    const onEstimateClick = useCallback(
        (e: Estimate) => {
            const selected = new Set(value);
            selected.has(estimateToString(e))
                ? selected.delete(estimateToString(e))
                : selected.add(estimateToString(e));
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
            onChange={onEstimateClick}
            items={estimates}
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
                <MenuItem
                    ghost
                    key={estimateToString(props.item)}
                    selected={value?.includes(estimateToString(props.item))}
                    onClick={props.onClick}
                >
                    {estimateToString(props.item)}
                </MenuItem>
            )}
        />
    );
});
