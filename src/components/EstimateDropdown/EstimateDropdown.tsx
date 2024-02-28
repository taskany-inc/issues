import { DatePicker, DatePickerYear, DatePickerQuarter, DatePickerStrict, Text } from '@taskany/bricks/harmony';
import { ComponentProps, useCallback, useMemo, useState } from 'react';
import { nullable } from '@taskany/bricks';

import { formateEstimate, getDateString } from '../../utils/dateTime';
import { DropdownPanel, Dropdown, DropdownTrigger } from '../Dropdown/Dropdown';
import { useLocale } from '../../hooks/useLocale';
import { DateType } from '../../types/date';
import { estimateYearTrigger, estimateQuarterTrigger, estimateStrictDateTrigger } from '../../utils/domObjects';

import { tr } from './EstimateDropdown.i18n';
import s from './EstimateDropdown.module.css';

interface Estimate {
    date: string;
    type?: DateType;
}

interface EstimateState {
    type?: DateType;
    range: { end: Date };
}

interface EstimateDropdownProps {
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    view?: ComponentProps<typeof DropdownTrigger>['view'];
    disabled?: boolean;
    readOnly?: boolean;
    className?: string;
    onChange?: (date: Estimate | null) => void;
    value?: Estimate;
}

export const EstimateDropdown = ({ onChange, value, ...props }: EstimateDropdownProps) => {
    const locale = useLocale();
    const [estimate, setEstimate] = useState<EstimateState | undefined>(
        value
            ? {
                  range: { end: new Date(value.date) },
                  type: value.type,
              }
            : undefined,
    );

    const onChangeHandler = useCallback(
        (value?: EstimateState) => {
            onChange?.(
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
        <Dropdown>
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
            <DropdownPanel width={330} placement="top-end" className={s.EstimateDropdownPanel}>
                <DatePicker translates={translates.default} value={estimate} onChange={onChangeHandler}>
                    <DatePickerYear translates={translates.year} {...estimateYearTrigger.attr} />
                    <DatePickerQuarter translates={translates.quarter} {...estimateQuarterTrigger.attr} />
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
