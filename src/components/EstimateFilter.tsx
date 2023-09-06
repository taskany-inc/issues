import { FiltersDropdown } from '@taskany/bricks';
import { FC, useMemo } from 'react';
import { Estimate as EstimateType } from '@prisma/client';

import { DateRange, QuartersKeys, createDateRange, encodeUrlDateRange } from '../utils/dateTime';

type Estimate = { q: EstimateType['q']; y: EstimateType['y'] };

const getDateRangeFrom = ({ q, y }: Estimate): DateRange => createDateRange(Number(y), q as QuartersKeys);

const estimateTitle = (estimate: Estimate) => {
    if (!estimate.q) {
        return estimate.y;
    }
    return `${estimate.q}/${estimate.y}`;
};

export const EstimateFilter: FC<{
    text: string;
    value: string[];
    estimates: Estimate[];
    onChange: (value: string[]) => void;
}> = ({ text, value, estimates, onChange }) => {
    const items = useMemo(
        () =>
            estimates.map((estimate) => ({
                id: encodeUrlDateRange(getDateRangeFrom(estimate)),
                data: estimateTitle(estimate),
            })),
        [estimates],
    );

    return <FiltersDropdown text={text} value={value} items={items} onChange={onChange} />;
};
