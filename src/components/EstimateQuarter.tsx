import { Button, useClickOutside } from '@taskany/bricks';
import { gray6, gapXs } from '@taskany/colors';
import { useState, useRef, useCallback, Dispatch, SetStateAction, useEffect } from 'react';
import styled from 'styled-components';

import { quarters, endOfQuarter, createLocaleDate } from '../utils/dateTime';
import { Estimate, Option, QuartersKeys } from '../types/estimate';
import { useLocale } from '../hooks/useLocale';

import { EstimateOption } from './EstimateOption';

const StyledQuarters = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: ${gapXs};
`;

const StyledCheckableButton = styled(Button)<{ checked?: boolean }>`
    background-color: ${({ checked }) => checked && gray6};
`;

interface EstimateQuarterProps {
    option: Option;
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

const quartersList = Object.values(quarters);

export const EstimateQuarter: React.FC<EstimateQuarterProps> = ({ option, value, readOnly, onChange, setReadOnly }) => {
    const locale = useLocale();
    const [selectedQuarter, setSelectedQuarter] = useState<QuartersKeys | null | undefined>(value?.q || null);
    const ref = useRef(null);

    useClickOutside(ref, () => {
        if (selectedQuarter) return;

        setReadOnly((prev) => ({ ...prev, quarter: true, date: true }));
        setSelectedQuarter(null);
    });

    useEffect(() => {
        if (readOnly) {
            setSelectedQuarter(null);
        }

        setSelectedQuarter(value?.q);
    }, [value?.q, readOnly]);

    const onToggleQuarter = useCallback(
        (quarter: QuartersKeys) => {
            return () => {
                setSelectedQuarter((prev) => {
                    if (!value) return prev;
                    const q = prev === quarter ? null : quarter;

                    if (q) {
                        const tmp = endOfQuarter(q);
                        tmp.setFullYear(+value.y);
                        value.date = createLocaleDate(tmp, { locale });
                    } else {
                        value.date = null;
                    }

                    value.q = q;
                    onChange?.(value);
                    return q;
                });
            };
        },
        [locale, onChange, value],
    );

    const onClick = useCallback(() => {
        setReadOnly({
            quarter: false,
            year: false,
            date: true,
        });
        onChange?.({ y: value?.y || `${new Date().getFullYear()}`, q: null, date: null });
    }, [onChange, setReadOnly, value?.y]);

    return (
        <EstimateOption
            title={option.title}
            clue={option.clue}
            readOnly={readOnly}
            onClick={onClick}
            renderTrigger={() => (
                <StyledQuarters ref={ref}>
                    {quartersList.map((quarter) => {
                        return (
                            <StyledCheckableButton
                                key={quarter}
                                size="s"
                                text={quarter}
                                checked={selectedQuarter === quarter}
                                onClick={onToggleQuarter(quarter)}
                            />
                        );
                    })}
                </StyledQuarters>
            )}
        />
    );
};
