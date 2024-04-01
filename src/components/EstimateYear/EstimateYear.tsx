import { Button } from '@taskany/bricks/harmony';
import { useEffect, useCallback } from 'react';

import { createLocaleDate, createYearRange, getYearFromDate } from '../../utils/dateTime';
import { useLocale } from '../../hooks/useLocale';
import { EstimateOption } from '../EstimateOption/EstimateOption';
import { useEstimateContext } from '../Estimate/EstimateProvider';
import { estimateYearItem, estimateYearTrigger } from '../../utils/domObjects';

import { tr } from './EstimateYear.i18n';
import s from './EstimateYear.module.css';

const currentYear = getYearFromDate(new Date());
const currentYearRange = createYearRange(currentYear);

const years: number[] = [];

for (let i = currentYear - 1; i <= currentYear + 4; i++) {
    years.push(i);
}

export const EstimateYear: React.FC = () => {
    const { readOnly, setReadOnly, year, setYear, setQuarterAlias } = useEstimateContext();
    const locale = useLocale();

    const onClose = useCallback(() => {
        setReadOnly({ date: true, year: true, quarter: true });
    }, [setReadOnly]);

    const changeHander = useCallback(
        (value?: number) => {
            if (!value) {
                onClose();
            } else {
                setQuarterAlias(undefined);
                setYear(value);
            }
        },
        [setQuarterAlias, setYear, onClose],
    );

    const onClick = useCallback(() => {
        setReadOnly((prev) => ({ ...prev, date: true, year: false }));
    }, [setReadOnly]);

    useEffect(() => {
        if (!readOnly.year) {
            setYear((value) => value || currentYear);
        }
    }, [readOnly.year, setYear]);

    return (
        <EstimateOption
            title={tr('Year title')}
            clue={tr
                .raw('Year clue', {
                    end: createLocaleDate(currentYearRange.end, { locale }),
                })
                .join('')}
            readOnly={readOnly.year}
            onClick={onClick}
            onClose={onClose}
            renderTrigger={() => (
                <div className={s.EstimateYearTriggerWrapper}>
                    <div className={s.EstimateYearItems}>
                        {years.map((y) => (
                            <Button
                                key={y}
                                size="xs"
                                text={String(y)}
                                view={year === y ? 'checked' : undefined}
                                onClick={() => changeHander(year === y ? undefined : y)}
                                {...estimateYearItem.attr}
                            />
                        ))}
                    </div>
                </div>
            )}
            {...estimateYearTrigger.attr}
        />
    );
};
