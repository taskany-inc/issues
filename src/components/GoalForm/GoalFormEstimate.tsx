import { ComponentProps, FC, useEffect, useState } from 'react';

import { DateType } from '../../types/date';
import { getDateString } from '../../utils/dateTime';
import { Estimate as EstimateComponent } from '../Estimate/Estimate';

type Estimate = {
    date: string;
    type: DateType;
};

type GoalFormEstimateProps = Omit<ComponentProps<typeof EstimateComponent>, 'onChange' | 'value'> & {
    onChange: (date?: Estimate) => void;
    value?: Estimate;
};

export const GoalFormEstimate: FC<GoalFormEstimateProps> = ({ onChange, value, ...props }) => {
    const [estimate, setEstimate] = useState<ComponentProps<typeof EstimateComponent>['value']>(
        value
            ? {
                  range: { end: new Date(value.date) },
                  type: value.type,
              }
            : undefined,
    );

    useEffect(() => {
        if (!estimate) {
            onChange();
            return;
        }

        const date = getDateString(estimate.range.end);

        if (date !== value?.date || estimate.type !== value?.type) {
            onChange({
                date,
                type: estimate.type,
            });
        }
    }, [value, estimate, onChange]);

    return <EstimateComponent value={estimate} onChange={setEstimate} {...props} />;
};
