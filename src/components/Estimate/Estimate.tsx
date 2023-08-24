import React, { ReactNode } from 'react';

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
    renderTrigger: (values: { onClick: () => void }) => ReactNode;
    onChange?: (value?: EstimateType) => void;
    onClose?: () => void;
    value?: EstimateType;
    placeholder: string;
    mask: string;
    placement?: PopupProps['placement'];
    error?: { message?: string };
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
    const locale = useLocale();
    const options = [
        {
            title: tr('Year title'),
            clue: tr('Year clue'),
            renderItem: (option: Option) => <EstimateYear option={option} onChange={onChange} value={value} />,
        },
        {
            title: tr('Quarter title'),
            clue: `${tr('Quarter clue')} ${quarterFromDate(new Date())}.`,
            renderItem: (option: Option) => <EstimateQuarter option={option} onChange={onChange} value={value} />,
        },
        {
            title: tr('Date title'),
            clue: null,
            renderItem: (option: Omit<Option, 'clue'>) => (
                <EstimateDate placeholder={placeholder} mask={mask} option={option} onChange={onChange} value={value} />
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
            renderItem={(option: Option) => {
                return optionsMap[option.title].renderItem(option);
            }}
            renderTrigger={renderTrigger}
            onClose={onClose}
        />
    );
};
