import React, { ReactNode, useState } from 'react';

import { isPastDate, parseLocaleDate, quarterFromDate } from '../../utils/dateTime';
import { PopupProps } from '../OutlinePopup';
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
    placement?: PopupProps['placement'];
    error?: { message?: string };
    renderTrigger: (values: { onClick: () => void }) => ReactNode;
    onChange?: (value?: EstimateType) => void;
    onClose?: () => void;
}

export const Estimate: React.FC<EstimateProps> = ({
    renderTrigger,
    onChange,
    onClose,
    value,
    mask,
    placeholder,
    placement,
    error,
}) => {
    const [readOnly, setReadOnly] = useState({ year: false, quarter: true, date: true });
    const locale = useLocale();
    const options = [
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
    ];

    type ReduceOption = (typeof options)[number];
    const optionsMap = options.reduce<Record<string, ReduceOption>>((acc, cur) => {
        acc[cur.title] = cur;
        return acc;
    }, {});

    const items = options.map(({ renderItem: _, ...rest }) => rest);

    const warning =
        (value && +value.y < new Date().getFullYear()) ||
        (value?.date && isPastDate(parseLocaleDate(value.date, { locale })))
            ? { message: tr('Date is past') }
            : undefined;

    return (
        <EstimatePopup
            items={items}
            placement={placement}
            error={error}
            warning={warning}
            renderItem={(option: Option) => optionsMap[option.title].renderItem(option)}
            renderTrigger={renderTrigger}
            onClose={onClose}
        />
    );
};
