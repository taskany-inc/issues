import { nullable } from '@taskany/bricks';
import { gapXs } from '@taskany/colors';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Button } from '@taskany/bricks/harmony';

import { Quarters, QuartersAliases, QuartersKeys } from '../../types/date';
import { useLocale } from '../../hooks/useLocale';
import { createLocaleDate, getQuarterFromDate, getRelativeQuarterRange, getYearFromDate } from '../../utils/dateTime';
import { EstimateOption } from '../EstimateOption';
import { useEstimateContext } from '../Estimate/EstimateProvider';
import { estimateQuarterItem, estimateQuarterTrigger } from '../../utils/domObjects';

import { tr } from './EstimateQuarter.i18n';

const StyledItems = styled.div<{ column: number }>`
    display: grid;
    grid-template-columns: repeat(${({ column }) => column}, 1fr);
    gap: ${gapXs};
`;

const StyledButtonGroupsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapXs};
`;

interface EstimateQuarterProps {
    aliases?: QuartersAliases[];
}

const quartersList = Object.values(Quarters);

const ButtonGroup = <T extends string>({
    items,
    value,
    onChange,
}: {
    items: T[];
    value?: T;
    onChange: (value?: T) => void;
}) => {
    const onToggleAlias = useCallback(
        (newValue: T) => () => {
            onChange(value === newValue ? undefined : newValue);
        },
        [onChange, value],
    );

    return (
        <StyledItems column={items.length}>
            {items.map((item) => (
                <Button
                    key={item}
                    size="xs"
                    view={value === item ? 'checked' : undefined}
                    text={item}
                    onClick={onToggleAlias(item)}
                    {...estimateQuarterItem.attr}
                />
            ))}
        </StyledItems>
    );
};

const currentQuarterRange = getRelativeQuarterRange(QuartersAliases['@current']);
const currentQuarter = getQuarterFromDate(currentQuarterRange.end);

export const EstimateQuarter: React.FC<EstimateQuarterProps> = ({ aliases }) => {
    const { readOnly, setReadOnly, quarter, quarterAlias, setQuarter, setYear, setQuarterAlias } = useEstimateContext();

    const locale = useLocale();

    const onClick = useCallback(() => {
        setReadOnly({
            quarter: false,
            year: false,
            date: true,
        });
        setQuarter((value) => value || currentQuarter);
    }, [setReadOnly, setQuarter]);

    const onClose = useCallback(() => {
        setReadOnly((prev) => ({ ...prev, quarter: true, date: true }));
    }, [setReadOnly]);

    const onQuarterChange = useCallback(
        (value?: QuartersKeys) => {
            if (!value) {
                onClose();
            }
            setQuarter(value);
            setQuarterAlias(undefined);
        },
        [setQuarter, setQuarterAlias, onClose],
    );

    const onQuarterAliasesChange = useCallback(
        (value?: QuartersAliases) => {
            if (value) {
                const dateRange = getRelativeQuarterRange(value);

                setYear(getYearFromDate(dateRange.end));
                setQuarter(getQuarterFromDate(dateRange.end));
            }

            setQuarterAlias(value);
        },
        [setYear, setQuarter, setQuarterAlias],
    );

    return (
        <EstimateOption
            title={tr('Quarter title')}
            clue={tr
                .raw('Quarter clue', {
                    quarter: currentQuarter,
                    end: createLocaleDate(currentQuarterRange.end, { locale }),
                })
                .join('')}
            readOnly={readOnly.quarter}
            onClick={onClick}
            onClose={onClose}
            renderTrigger={() => (
                <StyledButtonGroupsWrapper>
                    <ButtonGroup items={quartersList} value={quarter} onChange={onQuarterChange} />

                    {nullable(aliases, (items) => (
                        <ButtonGroup items={items} value={quarterAlias} onChange={onQuarterAliasesChange} />
                    ))}
                </StyledButtonGroupsWrapper>
            )}
            {...estimateQuarterTrigger.attr}
        />
    );
};
