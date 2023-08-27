import React, { ComponentProps, ReactNode, useMemo, useState } from 'react';

import { isPastDate, parseLocaleDate, quarterFromDate } from '../../utils/dateTime';
import { EstimateDate } from '../EstimateDate';
import { EstimateQuarter } from '../EstimateQuarter';
import { EstimateYear } from '../EstimateYear';
import { Estimate as EstimateType, Option } from '../../types/estimate';
import { useLocale } from '../../hooks/useLocale';
import { EstimatePopup } from '../EstimatePopup';

import { tr } from './Estimate.i18n';

interface EstimateProps {
    mask: string;
    placeholder: string;
    value?: EstimateType;
    placement?: ComponentProps<typeof EstimatePopup>['placement'];
    error?: { message?: string };
    renderTrigger: (values: { onClick: () => void }) => ReactNode;
    onChange?: (value?: EstimateType) => void;
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
    const [readOnly, setReadOnly] = useState({ year: false, quarter: true, date: true });
    const locale = useLocale();
    const options = useMemo(
        () => [
            {
                title: tr('Year title'),
                clue: tr('Year clue'),
                renderItem: (option: Option) => (
                    <EstimateYear
                        key={option.title}
                        option={option}
                        value={value}
                        readOnly={readOnly.year}
                        onChange={onChange}
                        setReadOnly={setReadOnly}
                    />
                ),
            },
            {
                title: tr('Quarter title'),
                clue: `${tr('Quarter clue')} ${quarterFromDate(new Date())}.`,
                renderItem: (option: Option) => (
                    <EstimateQuarter
                        key={option.title}
                        option={option}
                        value={value}
                        readOnly={readOnly.quarter}
                        onChange={onChange}
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
                        value={value}
                        readOnly={readOnly.date}
                        onChange={onChange}
                        setReadOnly={setReadOnly}
                    />
                ),
            },
        ],
        [value, mask, placeholder, readOnly, onChange],
    );

    const warning = useMemo(
        () =>
            (value && +value.y < new Date().getFullYear()) ||
            (value?.date && isPastDate(parseLocaleDate(value.date, { locale })))
                ? { message: tr('Date is past') }
                : undefined,
        [locale, value],
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
        />
    );
};
