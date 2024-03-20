import React, { ComponentProps, useCallback, useState } from 'react';

import { DateType } from '../../types/date';
import { getDateString } from '../../utils/dateTime';
import { EstimatePopup } from '../EstimatePopup/EstimatePopup';

interface Estimate {
    date: string;
    type: DateType;
}

type GoalFormEstimateProps = Omit<ComponentProps<typeof EstimatePopup>, 'onChange' | 'value'> & {
    onChange: (date: Estimate | null) => void;
    value?: Estimate;
};

export const GoalFormEstimate = React.forwardRef<HTMLDivElement, GoalFormEstimateProps>(
    ({ onChange, value, ...props }, ref) => {
        const [estimate, setEstimate] = useState<ComponentProps<typeof EstimatePopup>['value']>(
            value
                ? {
                      range: { end: new Date(value.date) },
                      type: value.type,
                  }
                : undefined,
        );

        const onChangeHandler = useCallback(
            (value: ComponentProps<typeof EstimatePopup>['value']) => {
                onChange(
                    value
                        ? {
                              date: getDateString(value.range.end),
                              type: value.type,
                          }
                        : null,
                );

                setEstimate(value);
            },
            [onChange],
        );

        return <EstimatePopup ref={ref} value={estimate} onChange={onChangeHandler} {...props} />;
    },
);
