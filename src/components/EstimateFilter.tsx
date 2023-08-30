import { FiltersDropdown } from '@taskany/bricks';
import { FC, useMemo } from 'react';

import { estimateToString, Estimate, encodeEstimateFilterValue } from '../utils/estimateToString';

export const EstimateFilter: FC<{
    text: string;
    value: string[];
    estimates: Estimate[];
    onChange: (value: string[]) => void;
}> = ({ text, value, estimates, onChange }) => {
    const items = useMemo(
        () =>
            estimates.map((estimate) => ({
                id: encodeEstimateFilterValue(estimate),
                data: estimateToString(estimate),
            })),
        [estimates],
    );

    return <FiltersDropdown text={text} value={value} items={items} onChange={onChange} />;
};
