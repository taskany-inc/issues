import { Button, Text, useClickOutside } from '@taskany/bricks';
import { gray9, gray7, gray6, gapXs, gapS } from '@taskany/colors';
import { IconPlusCircleSolid } from '@taskany/icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import { quarters, endOfQuarter, createLocaleDate } from '../utils/dateTime';
import { Estimate, Option, QuartersKeys } from '../types/estimate';
import { useLocale } from '../hooks/useLocale';

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapXs};
`;

const StyledContent = styled.div<{ readOnly: boolean }>`
    display: flex;
    align-items: ${({ readOnly }) => (readOnly ? 'center' : 'start')};
    gap: ${gapS};
    width: fit-content;
`;

const StyledQuarters = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${gapXs};
`;

const StyledCheckableButton = styled(Button)<{ checked?: boolean }>`
    ${({ checked }) =>
        checked &&
        `
            background-color: ${gray6};
        `}
`;

interface EstimateQuarterProps {
    option: Option;
    onChange?: (value?: Estimate) => void;
    value?: Estimate;
}

const quartersList = Object.values(quarters);

export const EstimateQuarter: React.FC<EstimateQuarterProps> = ({ option, onChange, value }) => {
    const locale = useLocale();
    const [selectedQuarter, setSelectedQuarter] = useState<QuartersKeys | null | undefined>(value?.q || null);
    const [readOnly, setReadOnly] = useState(true);
    const ref = useRef(null);
    useClickOutside(ref, () => !selectedQuarter && setReadOnly(true));

    useEffect(() => {
        if (value && !value?.q && selectedQuarter && !readOnly) {
            value.q = selectedQuarter;
            value.date = createLocaleDate(endOfQuarter(selectedQuarter), { locale });
            onChange?.(value);
        }
    }, [locale, onChange, readOnly, selectedQuarter, value]);

    useEffect(() => {
        if (readOnly) {
            setSelectedQuarter(null);
        }

        setSelectedQuarter(value?.q);
    }, [value?.q, readOnly]);

    const onToggleQuarter = (quarter: QuartersKeys) => {
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
    };

    const onClickIcon = useCallback(() => {
        setReadOnly(false);
    }, []);

    return (
        <StyledWrapper key={option.title}>
            <StyledContent readOnly={readOnly}>
                <Text weight="regular" size="s">
                    {option.title}
                </Text>
                {readOnly ? (
                    <IconPlusCircleSolid size="xs" color={gray9} onClick={onClickIcon} style={{ cursor: 'pointer' }} />
                ) : (
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
            </StyledContent>
            <Text weight="regular" size="xxs" color={gray7}>
                {option.clue}
            </Text>
        </StyledWrapper>
    );
};
