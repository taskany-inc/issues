import { useContext, createContext, FC, ReactNode } from 'react';

import { QuartersAliases, QuartersKeys } from '../../types/date';

interface ReadOnlyConfig {
    year: boolean;
    quarter: boolean;
    date: boolean;
}

interface SetState<T> {
    (state: T): T;
}

interface EstimateContext {
    readOnly: ReadOnlyConfig;
    setReadOnly: (update: ReadOnlyConfig | SetState<ReadOnlyConfig>) => void;
    year?: number;
    setYear: (year?: number | SetState<number | undefined>) => void;
    quarter?: QuartersKeys;
    setQuarter: (quarter?: QuartersKeys | SetState<QuartersKeys | undefined>) => void;
    quarterAlias?: QuartersAliases;
    setQuarterAlias: (alias?: QuartersAliases | SetState<QuartersAliases | undefined>) => void;
    date?: Date | undefined;
    setDate: (date?: Date | SetState<Date | undefined>) => void;
}

const estimateContext = createContext<EstimateContext>({
    readOnly: {
        year: true,
        quarter: true,
        date: true,
    },
    setReadOnly: () => {},
    setYear: () => {},
    setQuarter: () => {},
    setQuarterAlias: () => {},
    setDate: () => {},
});

export const useEstimateContext = () => useContext(estimateContext);

export const EstimateContextProvider: FC<{ value: EstimateContext; children: ReactNode }> = ({ value, children }) => (
    <estimateContext.Provider value={value}>{children}</estimateContext.Provider>
);
