import { FiltersDropdown } from '@taskany/bricks';
import { FC, useMemo } from 'react';

const estimateToString = (estimate: Estimate) => `${estimate.q}/${estimate.y}`;

type Estimate = {
    date: string;
    q: string;
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
