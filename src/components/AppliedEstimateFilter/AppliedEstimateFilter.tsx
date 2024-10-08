import { ComponentProps, useCallback, useMemo } from 'react';
import { AppliedFilter, TagCleanButton } from '@taskany/bricks/harmony';
import { decodeDateRangeFromString, encodeUrlDateRange } from '@taskany/bricks';

import { EstimateDropdown } from '../EstimateDropdown/EstimateDropdown';
import { appliedFiltersPanelEstimate } from '../../utils/domObjects';

interface AppliedEstimateFilterProps {
    label?: string;
    value?: string[];
    readOnly?: boolean;
    onChange?: (values?: string[]) => void;
    onClose?: () => void;
    onClearFilter?: () => void;
}

export const AppliedEstimateFilter = ({
    label,
    value,
    readOnly,
    onChange,
    onClose,
    onClearFilter,
}: AppliedEstimateFilterProps) => {
    const estimateValue = useMemo(() => {
        const [estimateValue] = value || [];
        const estimate = decodeDateRangeFromString(estimateValue);

        if (!estimate) return;

        return {
            ...estimate,
            date: `${estimate?.range.end || new Date()}`,
        };
    }, [value]);

    const handleChange = useCallback<NonNullable<ComponentProps<typeof EstimateDropdown>['onChange']>>(
        (value) => {
            if (!value) {
                onChange?.([]);
                return;
            }

            const date = value.alias || encodeUrlDateRange(value.range);
            onChange?.([date]);
        },
        [onChange],
    );

    return (
        <AppliedFilter readOnly={readOnly} label={label} action={<TagCleanButton size="s" onClick={onClearFilter} />}>
            <EstimateDropdown
                readOnly={readOnly}
                value={estimateValue}
                placement="bottom"
                onChange={handleChange}
                onClose={onClose}
                {...appliedFiltersPanelEstimate.attr}
            />
        </AppliedFilter>
    );
};
