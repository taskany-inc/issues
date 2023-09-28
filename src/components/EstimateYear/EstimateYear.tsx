import { Button } from '@taskany/bricks';
import { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { gapS, gapXs } from '@taskany/colors';

import { createLocaleDate, createYearRange, getYearFromDate } from '../../utils/dateTime';
import { useLocale } from '../../hooks/useLocale';
import { EstimateOption } from '../EstimateOption';
import { useEstimateContext } from '../Estimate/EstimateProvider';

import { tr } from './EstimateYear.i18n';

const StyledTriggerWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

const StyledItems = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: ${gapXs};
`;

const StyledButton = styled(Button)`
    display: flex;
    justify-content: center;
`;

const currentYear = getYearFromDate(new Date());
const currentYearRange = createYearRange(currentYear);

const years: number[] = [];

for (let i = currentYear - 1; i <= currentYear + 4; i++) {
    years.push(i);
}

export const EstimateYear: React.FC = () => {
    const { readOnly, setReadOnly, year, setYear, setQuarterAlias } = useEstimateContext();

    const locale = useLocale();

    const changeHander = useCallback(
        (value?: number) => {
            setQuarterAlias(undefined);
            setYear(value);
        },
        [setQuarterAlias, setYear],
    );

    const onClick = useCallback(() => {
        setReadOnly((prev) => ({ ...prev, date: true, year: false }));
    }, [setReadOnly]);

    useEffect(() => {
        if (!readOnly.year && !year) {
            changeHander(currentYear);
        }
    }, [readOnly.year, year, changeHander]);

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
            renderTrigger={() => (
                <StyledTriggerWrapper>
                    <StyledItems>
                        {years.map((y) => (
                            <StyledButton
                                key={y}
                                size="s"
                                text={String(y)}
                                checked={year === y}
                                onClick={() => changeHander(y)}
                            />
                        ))}
                    </StyledItems>
                </StyledTriggerWrapper>
            )}
        />
    );
};
