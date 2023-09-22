import { FiltersDropdown } from '@taskany/bricks';
import { FC, useMemo } from 'react';
import { Estimate as EstimateType } from '@prisma/client';

import { DateRange, QuartersKeys } from '../types/date';
import { createDateRange, encodeUrlDateRange, getRelativeQuarterRange } from '../utils/dateTime';

type Estimate = { q: EstimateType['q']; y: EstimateType['y'] };

const getDateRangeFrom = ({ q, y }: Estimate): DateRange => createDateRange(Number(y), q as QuartersKeys);

const estimateTitle = (estimate: Estimate) => {
    if (!estimate.q) {
        return estimate.y;
    }
    return `${estimate.q}/${estimate.y}`;
};

const getEstimateAliases = (): { data: string; id: string }[] => {
    return [
        {
            id: encodeUrlDateRange(getRelativeQuarterRange('current')),
            data: '@current',
        },
        {
            id: encodeUrlDateRange(getRelativeQuarterRange('prev')),
            data: '@previous',
        },
        {
            id: encodeUrlDateRange(getRelativeQuarterRange('next')),
            data: '@next',
        },
    ];
};

export const EstimateFilter: FC<{
    text: string;
    value: string[];
    estimates?: Estimate[];
    onChange: (value: string[]) => void;
}> = ({ text, value, estimates, onChange }) => {
    const items = useMemo(
        () => [
            ...getEstimateAliases(),
            ...(estimates?.map((estimate) => ({
                id: encodeUrlDateRange(getDateRangeFrom(estimate)),
                data: estimateTitle(estimate),
            })) ?? []),
        ],
        [estimates],
    );

    return <FiltersDropdown text={text} value={value} items={items} onChange={onChange} />;
};
