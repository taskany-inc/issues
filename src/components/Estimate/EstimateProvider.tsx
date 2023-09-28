import { useContext, createContext, FC, ReactNode } from 'react';

import { QuartersAliases, QuartersKeys } from '../../types/date';

type ReadOnlyConfig = {
    year: boolean;
    quarter: boolean;
    date: boolean;
};

type EstimateContext = {
    readOnly: ReadOnlyConfig;
    setReadOnly: (update: ReadOnlyConfig | ((cfg: ReadOnlyConfig) => ReadOnlyConfig)) => void;
    year?: number;
    setYear: (year?: number) => void;
    quarter?: QuartersKeys;
    setQuarter: (quarter?: QuartersKeys) => void;
    quarterAlias?: QuartersAliases;
    setQuarterAlias: (alias?: QuartersAliases) => void;
    date?: Date | undefined;
    setDate: (date?: Date) => void;
};

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
