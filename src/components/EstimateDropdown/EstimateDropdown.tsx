import { DatePicker, DatePickerYear, DatePickerQuarter, DatePickerStrict, Text } from '@taskany/bricks/harmony';
import { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import { nullable } from '@taskany/bricks';

import { formateEstimate, getDateString } from '../../utils/dateTime';
import { DropdownPanel, Dropdown, DropdownTrigger } from '../Dropdown/Dropdown';
import { useLocale } from '../../hooks/useLocale';
import { DateRange, DateType } from '../../types/date';
import {
    estimateYearTrigger,
    estimateQuarterTrigger,
    estimateStrictDateTrigger,
    combobox,
} from '../../utils/domObjects';

import { tr } from './EstimateDropdown.i18n';
import s from './EstimateDropdown.module.css';

interface Estimate {
    range?: DateRange;
    date: string;
    type?: DateType;
}

type EstimateState = Parameters<ComponentProps<typeof DatePicker>['onChange']>['0'];

interface EstimateDropdownProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    view?: ComponentProps<typeof DropdownTrigger>['view'];
    disabled?: boolean;
    readOnly?: boolean;
    className?: string;
    value?: Estimate | null;
    placement?: ComponentProps<typeof DropdownPanel>['placement'];
    onChange?: (value: (EstimateState & { date: Estimate['date'] }) | null) => void;
    onClose?: () => void;
}

const toEstimateState = (value: Estimate): EstimateState => {
    if (value.range) {
        return {
            range: {
                end: new Date(value.range.end),
                start: value.range.start != null ? new Date(value.range.start) : undefined,
            },
            type: value.type,
        };
    }

    return {
        range: { end: new Date(value.date), start: undefined },
        type: value.type,
    };
};

export const EstimateDropdown = ({ value, onChange, onClose, placement, ...props }: EstimateDropdownProps) => {
    const locale = useLocale();
    const [estimate, setEstimate] = useState<EstimateState | undefined>(value ? toEstimateState(value) : undefined);

    useEffect(() => {
        setEstimate(value ? toEstimateState(value) : undefined);
    }, [value]);

    const onChangeHandler = useCallback(
        (value?: EstimateState) => {
            onChange?.(
                value
                    ? {
                          date: getDateString(value.range.end),
                          ...value,
                      }
                    : null,
            );

            setEstimate(value);
        },
        [onChange],
    );

    const translates = useMemo(
        () => ({
            year: {
                title: tr('Year'),
                trigger: tr('Choose year'),
            },
            quarter: {
                title: tr('Quarter'),
                trigger: tr('Choose quarter'),
            },
            strict: {
                title: tr('Strict Date'),
                trigger: tr('Set date'),
                advice: tr('or type the strict date'),
            },
            default: {
                reset: tr('Reset'),
                warning: tr('warning'),
            },
        }),
        [],
    );

    const dateFragments: Record<'en' | 'ru', ('month' | 'day' | 'year')[]> = useMemo(
        () => ({
            en: ['month', 'day', 'year'],
            ru: ['day', 'month', 'year'],
        }),
        [],
    );

    return (
        <Dropdown arrow onClose={onClose}>
            <DropdownTrigger {...props}>
                {nullable(value, (v) => (
                    <Text size="s" as="span">
                        {formateEstimate(new Date(v.date), {
                            locale,
                            type: v.type,
                        })}
                    </Text>
                ))}
            </DropdownTrigger>
            <DropdownPanel width={330} placement={placement} className={s.EstimateDropdownPanel} {...combobox.attr}>
                <DatePicker translates={translates.default} value={estimate} onChange={onChangeHandler}>
                    <DatePickerYear translates={translates.year} {...estimateYearTrigger.attr} />
                    <DatePickerQuarter translates={translates.quarter} {...estimateQuarterTrigger.attr} withAliases />
                    <DatePickerStrict
                        translates={translates.strict}
                        dateFragments={dateFragments[locale]}
                        splitter="/"
                        {...estimateStrictDateTrigger.attr}
                    />
                </DatePicker>
            </DropdownPanel>
        </Dropdown>
    );
};
