import { useMemo } from 'react';

import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { EstimateDropdown } from '../EstimateDropdown/EstimateDropdown';
import { decodeEstimateFromUrl } from '../EstimateFilter';

interface AppliedEstimateFilterProps {
    label?: string;
    value?: string[];
    readOnly?: boolean;
}

export const AppliedEstimateFilter = ({ label, value, readOnly }: AppliedEstimateFilterProps) => {
    const estimateValue = useMemo(() => {
        const [estimateValue] = value || [];
        const estimate = decodeEstimateFromUrl(estimateValue);

        return {
            ...estimate,
            date: `${estimate?.range.end || new Date()}`,
        };
    }, [value]);

    return (
        <AppliedFilter readOnly={readOnly} label={label}>
            <EstimateDropdown readOnly={readOnly} value={estimateValue} placement="bottom" />
        </AppliedFilter>
    );
};
