import { Input, useClickOutside } from '@taskany/bricks';
import { IconXSolid } from '@taskany/icons';
import { useState, useRef, useCallback, Dispatch, SetStateAction, useEffect } from 'react';
import InputMask from 'react-input-mask';

import { useLocale } from '../../hooks/useLocale';
import { currentLocaleDate, parseLocaleDate, createLocaleDate } from '../../utils/dateTime';
import { Option } from '../../types/estimate';
import { EstimateOption } from '../EstimateOption';

import { tr } from './EstimateDate.i18n';

interface EstimateDateProps extends Option {
    value?: Date;
    readOnly?: boolean;
    onChange?: (value?: Date) => void;
    setReadOnly: Dispatch<
        SetStateAction<{
            year: boolean;
            quarter: boolean;
            date: boolean;
        }>
    >;
}

const expectedLength = 8;
const isDateFullyFilled = (date: string) => {
    const cleanedDate = date.replace(/[^0-9]/g, '');
    return cleanedDate.length === expectedLength;
};

export const EstimateDate: React.FC<EstimateDateProps> = ({ title, clue, readOnly, onChange, setReadOnly }) => {
    const locale = useLocale();
    const currentDate = currentLocaleDate({ locale });
    const [fullDate, setFullDate] = useState<string>(currentDate);
    const ref = useRef(null);

    useClickOutside(ref, () => {
        if (isDateFullyFilled(fullDate)) return;

        setReadOnly((prev) => ({
            ...prev,
            date: true,
            year: false,
        }));

        setFullDate(currentDate);
    });

    useEffect(() => {
        if (!readOnly && isDateFullyFilled(fullDate)) {
            onChange?.(parseLocaleDate(fullDate, { locale }));
        }
    }, [readOnly, fullDate, locale, onChange]);

    const onChangeDate = useCallback(
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
        setReadOnly((prev) => ({
            ...prev,
            date: true,
            year: false,
        }));
        setFullDate(currentDate);
        onChange?.();
    }, [currentDate, setReadOnly, onChange]);

    const onClick = useCallback(() => {
        setReadOnly({
            date: false,
            year: true,
            quarter: true,
        });
        setFullDate(currentDate);
    }, [currentDate, setReadOnly]);

    return (
        <EstimateOption
            title={title}
            clue={clue}
            readOnly={readOnly}
            onClick={onClick}
            renderTrigger={() => (
                <InputMask
                    mask={tr('Date input mask')}
                    placeholder={tr('Date input mask placeholder')}
                    onChange={onChangeDate}
                    value={fullDate}
                >
                    {/* @ts-ignore incorrect type in react-input-mask */}
                    {(props) => (
                        <Input ref={ref} iconRight={<IconXSolid size="xxs" onClick={onRemoveDate} />} {...props} />
                    )}
                </InputMask>
            )}
        />
    );
};
