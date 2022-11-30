import { useCallback, useState } from 'react';

import { safelyParseJson } from '../utils/safelyParseJson';

type SetValue<TValue> = (value: TValue | ((previousValue: TValue) => TValue)) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useLocalStorage<T>(storageKey: string, defaultValue?: any): [T, SetValue<T>] {
    const safelySetStorage = useCallback(
        (valueToStore: string) => {
            try {
                window.localStorage.setItem(storageKey, valueToStore);
                // eslint-disable-next-line no-empty
            } catch (e) {}
        },
        [storageKey],
    );

    const [storedValue, setStoredValue] = useState<T>(() => {
        let valueToStore: string;
        try {
            valueToStore = window.localStorage.getItem(storageKey) || JSON.stringify(defaultValue);
        } catch (e) {
            valueToStore = JSON.stringify(defaultValue);
        }

        safelySetStorage(valueToStore);
        return safelyParseJson(valueToStore);
    });

    const setValue: SetValue<T> = useCallback(
        (value) => {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            safelySetStorage(JSON.stringify(valueToStore));
            setStoredValue(valueToStore);
        },
        [safelySetStorage, storedValue],
    );

    return [storedValue, setValue];
}
