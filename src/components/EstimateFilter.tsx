import { FiltersDropdown } from '@taskany/bricks';
import { FC, useMemo } from 'react';

import { estimateToString } from '../utils/estimateToString';

type Estimate = {
    date: string | null;
    q: string | null;
    y: string;
};

export const EstimateFilter: FC<{
    text: string;
    value: string[];
    estimates: Estimate[];
    onChange: (value: string[]) => void;
}> = ({ text, value, estimates, onChange }) => {
    const items = useMemo(
        () => estimates.map((estimate) => ({ id: estimateToString(estimate), data: estimateToString(estimate) })),
        [estimates],
    );

    return <FiltersDropdown text={text} value={value} items={items} onChange={onChange} />;
};
