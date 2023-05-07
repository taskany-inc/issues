import { useCallback, useState } from 'react';

import { safelyParseJson } from '../utils/safelyParseJson';

export type LastOrCurrentProject = { id: string; title: string; flowId: string; description?: string | null } | null;
export type RecentProjectsCache = Record<
    string,
    { rate: number; cache: { id: string; title: string; flowId: string; description?: string | null } }
>;
type SetValue<TValue> = (value: TValue | ((previousValue: TValue) => TValue)) => void;
interface StorageKey {
    lastProjectCache: LastOrCurrentProject;
    currentProjectCache: LastOrCurrentProject;
    recentProjectsCache: RecentProjectsCache;
}

export function useLocalStorage<T extends keyof StorageKey>(
    storageKey: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValue?: any,
): [StorageKey[T], SetValue<StorageKey[T]>] {
    const safelySetStorage = useCallback(
        (valueToStore: string) => {
            try {
                window.localStorage.setItem(storageKey, valueToStore);
                // eslint-disable-next-line no-empty
            } catch (e) {}
        },
        [storageKey],
    );

    const [storedValue, setStoredValue] = useState<StorageKey[T]>(() => {
        let valueToStore: string;
        try {
            valueToStore = window.localStorage.getItem(storageKey) || JSON.stringify(defaultValue);
        } catch (e) {
            valueToStore = JSON.stringify(defaultValue);
        }

        safelySetStorage(valueToStore);
        return safelyParseJson(valueToStore);
    });

    const setValue: SetValue<StorageKey[T]> = useCallback(
        (value) => {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            safelySetStorage(JSON.stringify(valueToStore));
            setStoredValue(valueToStore);
        },
        [safelySetStorage, storedValue],
    );

    return [storedValue, setValue];
}
