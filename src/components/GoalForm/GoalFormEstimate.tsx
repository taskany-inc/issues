import { ComponentProps, FC, useEffect, useState } from 'react';
import { DateType } from '@prisma/client';

import { Estimate as EstimateComponent } from '../Estimate/Estimate';

type Estimate = {
    date: Date;
    type: DateType;
};

type GoalFormEstimateProps = Omit<ComponentProps<typeof EstimateComponent>, 'onChange' | 'value'> & {
    onChange: (date: Estimate) => void;
    value?: Estimate;
};

export const GoalFormEstimate: FC<GoalFormEstimateProps> = ({ onChange, value, ...props }) => {
    const [estimate, setEstimate] = useState<ComponentProps<typeof EstimateComponent>['value']>(
        value
            ? {
                  range: { end: value.date },
                  type: value.type,
              }
            : undefined,
    );

    useEffect(() => {
        if (estimate && (Number(estimate.range.end) !== Number(value?.date) || estimate.type !== value?.type)) {
            onChange({
                date: estimate.range.end,
                type: estimate.type,
            });
        }
    }, [value, estimate, onChange]);

    return <EstimateComponent value={estimate} onChange={setEstimate} {...props} />;
};
