import { Tab } from '@taskany/bricks';
import { ComponentProps, FC, useCallback, useMemo } from 'react';

import { useLocale } from '../hooks/useLocale';
import {
    encodeUrlDateRange,
    decodeUrlDateRange,
    getDateTypeFromRange,
    formateEstimate,
    decodeUrlQuarterAlias,
} from '../utils/dateTime';
import { TLocale } from '../utils/getLang';
import { QuartersAliases } from '../types/date';

import { FilterTabLabel } from './FilterTabLabel';
import { Estimate, EstimateValue } from './Estimate/Estimate';
import { EstimateYear } from './EstimateYear/EstimateYear';
import { EstimateQuarter } from './EstimateQuarter/EstimateQuarter';
import { EstimateDate } from './EstimateDate/EstimateDate';

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
        alias: decodeUrlQuarterAlias(value) || undefined,
    };
};

export const getEstimateLabel = (estimate: EstimateValue, locale: TLocale): string =>
    estimate.alias
        ? estimate.alias
        : formateEstimate(estimate.range.end, {
              locale,
              type: estimate.type,
          });

const quartersAliasesList = Object.values(QuartersAliases);

export const EstimateFilter: FC<{
    text: string;
    value?: string[];
    onChange: (value: string[]) => void;
}> = ({ text, value = [], onChange }) => {
    const locale = useLocale();

    const onChangeHandler = useCallback(
        (value?: ComponentProps<typeof Estimate>['value']) => {
            if (value) {
                onChange([value.alias ? value.alias : encodeUrlDateRange(value.range)]);
            } else {
                onChange([]);
            }
        },
        [onChange],
    );

    const { estimateValue, estiamteLabel } = useMemo(() => {
        const estimateValue = value.map((v) => decodeEstimateFromUrl(v)).filter(Boolean);

        return {
            estimateValue: estimateValue[0],
            estiamteLabel: estimateValue.map((v) => getEstimateLabel(v, locale)) ?? [],
        };
    }, [value, locale]);

    return (
        <Tab name="estimate" label={<FilterTabLabel text={text} selected={estiamteLabel} />}>
            <Estimate onChange={onChangeHandler} value={estimateValue}>
                <EstimateYear />
                <EstimateQuarter aliases={quartersAliasesList} />
                <EstimateDate />
            </Estimate>
        </Tab>
    );
};
