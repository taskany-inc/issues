import { useMemo } from 'react';

interface SetRef {
    <T>(
        ref: React.MutableRefObject<T | null> | ((instance: T | null) => void) | null | undefined,
        value: T | null,
    ): void;
}

export const setRef: SetRef = (ref, value) => {
    if (typeof ref === 'function') {
        ref(value);
    } else if (ref) {
        ref.current = value;
    }
};

export interface UseForkRefHook {
    <T>(refOne: React.Ref<T>, refTwo: React.Ref<T>): React.Ref<T>;
}

export const useForkedRef: UseForkRefHook = (refOne, refTwo) => {
    return useMemo(() => {
        if (refOne == null && refTwo === null) {
            return null;
        }

        return (refOb) => {
            setRef(refOne, refOb);
            setRef(refTwo, refOb);
        };
    }, [refOne, refTwo]);
};
