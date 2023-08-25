import { Input, useClickOutside } from '@taskany/bricks';
import { IconXSolid } from '@taskany/icons';
import { useState, useRef, useCallback, Dispatch, SetStateAction, useEffect } from 'react';
import InputMask from 'react-input-mask';

import { useLocale } from '../hooks/useLocale';
import { currentLocaleDate, createValue, parseLocaleDate, createLocaleDate } from '../utils/dateTime';
import { Option, Estimate } from '../types/estimate';

import { EstimateOption } from './EstimateOption';

interface EstimateDateProps {
    mask: string;
    placeholder: string;
    option: Omit<Option, 'clue'>;
    value?: Estimate;
    readOnly?: boolean;
    onChange?: (value?: Estimate) => void;
    setReadOnly: Dispatch<
        SetStateAction<{
            year: boolean;
            quarter: boolean;
            date: boolean;
        }>
    >;
}

export const EstimateDate: React.FC<EstimateDateProps> = ({
    mask,
    placeholder,
    option,
    value,
    readOnly,
    onChange,
    setReadOnly,
}) => {
    const locale = useLocale();
    const currentDate = currentLocaleDate({ locale });
    const [fullDate, setFullDate] = useState(currentDate);
    const ref = useRef(null);

    useClickOutside(ref, () => {
        if (!fullDate.includes('_')) return;

        setFullDate(currentDate);
        setReadOnly((prev) => {
            prev.date = true;
            prev.year = false;
            return prev;
        });
        value ? (value.date = null) : undefined;
        onChange?.(value);
    });

    useEffect(() => {
        if (fullDate.includes('_') || fullDate === currentDate) return;

        const values = createValue(fullDate, locale);
        onChange?.(values);
    }, [currentDate, fullDate, locale, onChange]);

    const onCreateEstimate = useCallback(
        (date: string | Date) => {
            date = parseLocaleDate(date, { locale });
            value?.y && date.setFullYear(+value.y);

            return createValue(date, locale);
        },
        [locale, value?.y],
    );

    const onChangeDate = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;

            if (value.includes('_')) {
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
        if (!value) return;

        value.date = null;
        value.q = null;

        setReadOnly((prev) => {
            prev.date = true;
            prev.year = false;
            return prev;
        });
        setFullDate(currentDate);
        onChange?.(value);
    }, [currentDate, onChange, setReadOnly, value]);

    const onClickIcon = useCallback(() => {
        const estimate = onCreateEstimate(currentDate);

        setReadOnly({
            date: false,
            year: true,
            quarter: true,
        });
        setFullDate(estimate.date);
        onChange?.(estimate);
    }, [onCreateEstimate, currentDate, setReadOnly, onChange]);

    return (
        <EstimateOption
            title={option.title}
            readOnly={readOnly}
            onClickIcon={onClickIcon}
            renderTrigger={() => (
                <InputMask mask={mask} placeholder={placeholder} onChange={onChangeDate} value={fullDate}>
                    {/* @ts-ignore incorrect type in react-input-mask */}
                    {(props) => (
                        <Input ref={ref} iconRight={<IconXSolid size="xxs" onClick={onRemoveDate} />} {...props} />
                    )}
                </InputMask>
            )}
        />
    );
};
