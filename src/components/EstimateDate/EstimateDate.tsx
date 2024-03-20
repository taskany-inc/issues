import { FormControl, FormControlInput } from '@taskany/bricks/harmony';
import { IconXSolid } from '@taskany/icons';
import { useState, useCallback, useEffect } from 'react';
import InputMask from 'react-input-mask';

import { useLocale } from '../../hooks/useLocale';
import { currentLocaleDate, parseLocaleDate, createLocaleDate } from '../../utils/dateTime';
import { EstimateOption } from '../EstimateOption/EstimateOption';
import { useEstimateContext } from '../Estimate/EstimateProvider';
import { estimateStrictDateInput, estimateStrictDateTrigger } from '../../utils/domObjects';

import { tr } from './EstimateDate.i18n';

const expectedLength = 8;
const isDateFullyFilled = (date: string) => {
    const cleanedDate = date.replace(/[^0-9]/g, '');
    return cleanedDate.length === expectedLength;
};

export const EstimateDate: React.FC = () => {
    const locale = useLocale();
    const currentDate = currentLocaleDate({ locale });

    const { readOnly, setReadOnly, setDate, date } = useEstimateContext();

    const valueString = date ? createLocaleDate(date, { locale }) : undefined;

    const [fullDate, setFullDate] = useState<string>(valueString ?? currentDate);

    useEffect(() => {
        if (!readOnly.date) {
            setFullDate((oldDate) => (isDateFullyFilled(oldDate) ? oldDate : currentDate));
        }
    }, [readOnly.date, currentDate]);

    useEffect(() => {
        if (isDateFullyFilled(fullDate) && valueString !== fullDate) {
            setDate(parseLocaleDate(fullDate, { locale }));
        }
    }, [fullDate, setDate, locale, valueString]);

    const onInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;

            if (!isDateFullyFilled(value)) {
                setFullDate(value);
                return;
            }

            const date = parseLocaleDate(value, { locale });

            if (Number.isNaN(new Date(date).getTime())) {
                setFullDate(currentDate);
                return;
            }

            setFullDate(createLocaleDate(date, { locale }));
        },
        [currentDate, locale],
    );

    const onRemoveDate = useCallback(() => {
        setFullDate(currentDate);
    }, [currentDate]);

    const onClick = useCallback(() => {
        setReadOnly({
            date: false,
            year: true,
            quarter: true,
        });
    }, [setReadOnly]);

    const onClose = useCallback(() => {
        setReadOnly((prev) => ({ ...prev, quarter: true, date: true }));
    }, [setReadOnly]);

    return (
        <EstimateOption
            title={tr('Date title')}
            clue={tr('Date clue')}
            readOnly={readOnly.date}
            onClick={onClick}
            onClose={onClose}
            renderTrigger={() => (
                <InputMask
                    mask={tr('Date input mask')}
                    placeholder={tr('Date input mask placeholder')}
                    onChange={onInputChange}
                    value={fullDate}
                    {...estimateStrictDateInput.attr}
                >
                    {/* @ts-ignore incorrect type in react-input-mask */}
                    {(props) => (
                        <FormControl>
                            <FormControlInput
                                outline
                                size="xs"
                                iconRight={<IconXSolid size="xxs" onClick={onRemoveDate} />}
                                {...props}
                            />
                        </FormControl>
                    )}
                </InputMask>
            )}
            {...estimateStrictDateTrigger.attr}
        />
    );
};
