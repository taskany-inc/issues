import { Tab } from '@taskany/bricks';
import { ComponentProps, FC, useCallback, useMemo } from 'react';

import { useLocale } from '../hooks/useLocale';
import { encodeUrlDateRange, decodeUrlDateRange, getDateTypeFromRange, formateEstimate } from '../utils/dateTime';

import { FilterTabLabel } from './FilterTabLabel';
import { Estimate, EstimateValue } from './Estimate/Estimate';

export const decodeEstimateFromUrl = (value: string): EstimateValue | undefined => {
    if (!value) {
        return undefined;
    }

    const range = decodeUrlDateRange(value);

    if (!range) {
        return undefined;
    }

    return {
        range,
        type: getDateTypeFromRange(range),
    };
};

export const EstimateFilter: FC<{
    text: string;
    value?: string[];
    onChange: (value: string[]) => void;
}> = ({ text, value = [], onChange }) => {
    const locale = useLocale();

    const onChangeHandler = useCallback(
        (value?: ComponentProps<typeof Estimate>['value']) => {
            onChange(value ? [encodeUrlDateRange(value.range)] : []);
        },
        [onChange],
    );

    const { estiamteValue, estiamteLabel } = useMemo(() => {
        const estiamteValue = decodeEstimateFromUrl(value[0]);
        return {
            estiamteValue,
            estiamteLabel: estiamteValue
                ? [
                      formateEstimate(estiamteValue.range.end, {
                          locale,
                          type: estiamteValue.type,
                      }),
                  ]
                : [],
        };
    }, [value, locale]);

    return (
        <Tab name="estimate" label={<FilterTabLabel text={text} selected={estiamteLabel} />}>
            <Estimate onChange={onChangeHandler} value={estiamteValue} />
        </Tab>
    );
};
