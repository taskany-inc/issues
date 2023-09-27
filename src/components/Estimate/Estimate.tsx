import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { gapXs, gapS, warn0 } from '@taskany/colors';
import { nullable, Text } from '@taskany/bricks';
import { IconExclamationSmallOutline } from '@taskany/icons';

import {
    createDateRange,
    isPastDate,
    getQuarterFromDate,
    getYearFromDate,
    getDateString,
    getRelativeQuarterRange,
    createLocaleDate,
    createYearRange,
} from '../../utils/dateTime';
import { useLocale } from '../../hooks/useLocale';
import { DateType, DateRange } from '../../types/date';
import { EstimateDate } from '../EstimateDate/EstimateDate';
import { EstimateQuarter } from '../EstimateQuarter';
import { EstimateYear } from '../EstimateYear';

import { tr } from './Estimate.i18n';

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

const StyledWarningWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: ${gapXs};
`;

const StyledIconExclamationSmallOutline = styled(IconExclamationSmallOutline)`
    border-radius: 100%;
    align-items: center;
    display: block;
    background: ${warn0};
    font-size: 0;
`;

export type EstimateValue = {
    type: DateType;
    range: DateRange;
};

export interface EstimateProps {
    value?: EstimateValue;
    onChange?: (value?: EstimateValue) => void;
}

export const getReadOnlyFields = (type: EstimateValue['type']) => {
    if (type === 'Strict') {
        return { year: true, quarter: true, date: false };
    }
    if (type === 'Quarter') {
        return { year: false, quarter: false, date: true };
    }
    return { year: false, quarter: true, date: true };
};

const currentQuarterRange = getRelativeQuarterRange('current');
const currentQuarter = getQuarterFromDate(currentQuarterRange.end);
const currentYearRange = createYearRange(getYearFromDate(new Date()));

export const Estimate = React.forwardRef<HTMLDivElement, EstimateProps>(({ value, onChange }, ref) => {
    const locale = useLocale();
    const [readOnly, setReadOnly] = useState(
        value ? getReadOnlyFields(value.type) : { year: true, quarter: true, date: true },
    );
    const [year, setYear] = useState(value ? getYearFromDate(value.range.end) : undefined);
    const [quarter, setQuarter] = useState(value ? getQuarterFromDate(value.range.end) : undefined);
    const [date, setDate] = useState(value ? value.range.end : undefined);

    const onChangeHandler = useCallback(
        (newValue?: EstimateValue) => {
            const oldStartDate = value && value.range.start ? getDateString(value.range.start) : null;
            const newStartDate = newValue && newValue.range.start ? getDateString(newValue.range.start) : null;

            const oldEndDate = value ? getDateString(value.range.end) : null;
            const newEndDate = newValue ? getDateString(newValue.range.end) : null;

            if (value?.type !== newValue?.type || oldStartDate !== newStartDate || oldEndDate !== newEndDate) {
                onChange?.(newValue);
            }
        },
        [value, onChange],
    );

    useEffect(() => {
        if (readOnly.quarter && readOnly.year && readOnly.date) {
            return;
        }

        if (!readOnly.quarter) {
            onChangeHandler?.(
                year
                    ? {
                          range: createDateRange(year, quarter),
                          type: quarter ? 'Quarter' : 'Year',
                      }
                    : undefined,
            );
        } else if (!readOnly.year) {
            onChangeHandler?.(
                year
                    ? {
                          range: createDateRange(year),
                          type: 'Year',
                      }
                    : undefined,
            );
        } else {
            onChangeHandler?.(
                date
                    ? {
                          range: { end: date },
                          type: 'Strict',
                      }
                    : undefined,
            );
        }
    }, [year, quarter, date, onChangeHandler, readOnly]);

    const warning = useMemo(
        () => (value && isPastDate(value.range.end) ? { message: tr('Date is past') } : undefined),
        [value],
    );

    return (
        <StyledWrapper ref={ref}>
            {nullable(warning, (warn) => (
                <StyledWarningWrapper>
                    <StyledIconExclamationSmallOutline size="xs" />
                    <Text color={warn0} size="xs">
                        {warn.message}
                    </Text>
                </StyledWarningWrapper>
            ))}
            <EstimateYear
                title={tr('Year title')}
                clue={tr
                    .raw('Year clue', {
                        end: createLocaleDate(currentYearRange.end, { locale }),
                    })
                    .join('')}
                value={year}
                readOnly={readOnly.year}
                onChange={setYear}
                setReadOnly={setReadOnly}
            />
            <EstimateQuarter
                title={tr('Quarter title')}
                clue={`${tr
                    .raw('Quarter clue', {
                        quarter: currentQuarter,
                        end: createLocaleDate(currentQuarterRange.end, { locale }),
                    })
                    .join('')}`}
                value={quarter}
                readOnly={readOnly.quarter}
                onChange={setQuarter}
                setReadOnly={setReadOnly}
            />
            <EstimateDate
                title={tr('Date title')}
                clue={tr('Date clue')}
                value={date}
                readOnly={readOnly.date}
                onChange={setDate}
                setReadOnly={setReadOnly}
            />
        </StyledWrapper>
    );
});
