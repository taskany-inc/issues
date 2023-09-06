import React, { ComponentProps, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { createDateRange, isPastDate, getQuarterFromDate, getYearFromDate } from '../../utils/dateTime';
import { DateType, DateRange } from '../../types/date';
import { EstimateDate } from '../EstimateDate';
import { EstimateQuarter } from '../EstimateQuarter';
import { EstimateYear } from '../EstimateYear';
import { Option } from '../../types/estimate';
import { EstimatePopup } from '../EstimatePopup';

import { tr } from './Estimate.i18n';

type EstimateValue = {
    type: DateType;
    range: DateRange;
};

export interface EstimateProps {
    mask: string;
    placeholder: string;
    value?: EstimateValue;
    placement?: ComponentProps<typeof EstimatePopup>['placement'];
    error?: { message?: string };
    renderTrigger: (values: { onClick: () => void }) => ReactNode;
    onChange?: (value?: EstimateValue) => void;
    onClose?: () => void;
}

export const Estimate: React.FC<EstimateProps> = ({
    mask,
    placeholder,
    value,
    placement,
    error,
    renderTrigger,
    onChange,
    onClose,
}) => {
    const [readOnly, setReadOnly] = useState({ year: true, quarter: true, date: true });
    const [year, setYear] = useState(value ? getYearFromDate(value.range.end) : undefined);
    const [quarter, setQuarter] = useState(value ? getQuarterFromDate(value.range.end) : undefined);
    const [date, setDate] = useState(value ? value.range.end : undefined);

    const onOpen = useCallback(() => {
        if (value?.type === 'Strict') {
            setReadOnly({ year: true, quarter: true, date: false });
        } else if (value?.type === 'Quarter') {
            setReadOnly({ year: false, quarter: false, date: true });
        } else {
            setReadOnly({ year: false, quarter: true, date: true });
        }
    }, [value]);

    useEffect(() => {
        if (readOnly.quarter && readOnly.year && readOnly.date) {
            return;
        }

        if (!readOnly.quarter) {
            onChange?.(
                year
                    ? {
                          range: createDateRange(year, quarter),
                          type: quarter ? 'Quarter' : 'Year',
                      }
                    : undefined,
            );
        } else if (!readOnly.year) {
            onChange?.(
                year
                    ? {
                          range: createDateRange(year),
                          type: 'Year',
                      }
                    : undefined,
            );
        } else {
            onChange?.(
                date
                    ? {
                          range: { end: date },
                          type: 'Strict',
                      }
                    : undefined,
            );
        }
    }, [year, quarter, date, onChange, readOnly]);

    const options = useMemo(
        () => [
            {
                title: tr('Year title'),
                clue: tr('Year clue'),
                renderItem: (option: Option) => (
                    <EstimateYear
                        key={option.title}
                        option={option}
                        value={year}
                        readOnly={readOnly.year}
                        onChange={setYear}
                        setReadOnly={setReadOnly}
                    />
                ),
            },
            {
                title: tr('Quarter title'),
                clue: `${tr('Quarter clue')} ${getQuarterFromDate(new Date())}.`,
                renderItem: (option: Option) => (
                    <EstimateQuarter
                        key={option.title}
                        option={option}
                        value={quarter}
                        readOnly={readOnly.quarter}
                        onChange={setQuarter}
                        setReadOnly={setReadOnly}
                    />
                ),
            },
            {
                title: tr('Date title'),
                clue: null,
                renderItem: (option: Option) => (
                    <EstimateDate
                        key={option.title}
                        mask={mask}
                        placeholder={placeholder}
                        option={option}
                        value={date}
                        readOnly={readOnly.date}
                        onChange={setDate}
                        setReadOnly={setReadOnly}
                    />
                ),
            },
        ],
        [date, quarter, year, mask, placeholder, readOnly],
    );

    const warning = useMemo(
        () => (value && isPastDate(value.range.end) ? { message: tr('Date is past') } : undefined),
        [value],
    );

    return (
        <EstimatePopup
            items={options}
            placement={placement}
            error={error}
            warning={warning}
            renderItem={({ renderItem, ...option }) => renderItem?.(option)}
            renderTrigger={renderTrigger}
            onClose={onClose}
            onOpen={onOpen}
        />
    );
};
