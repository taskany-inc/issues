import { MutableRefObject, useCallback, useState } from 'react';

import { safelyParseJson } from '../utils/safelyParseJson';

import { useLatest } from './useLatest';

export type LastOrCurrentProject = { id: string; title: string; flowId: string; description?: string | null } | null;
export type RecentProjectsCache = Record<
    string,
    { rate: number; cache: { id: string; title: string; flowId: string; description?: string | null } }
>;
export type GoalCreateFormAction = number | null;
export type DraftGoalComment = Record<string, { stateId?: string; description?: string }>;
type SetValue<TValue> = (value: TValue | ((previousValue: TValue) => TValue)) => void;
interface StorageKey {
    lastProjectCache: LastOrCurrentProject;
    currentProjectCache: LastOrCurrentProject;
    recentProjectsCache: RecentProjectsCache;
    goalCreateFormAction: GoalCreateFormAction;
    draftGoalComment: DraftGoalComment;
}

export function useLocalStorage<T extends keyof StorageKey>(
    storageKey: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValue?: any,
): [StorageKey[T], SetValue<StorageKey[T]>, MutableRefObject<StorageKey[T]>] {
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

    const storedValueRef = useLatest(storedValue);
    const setValue: SetValue<StorageKey[T]> = useCallback(
        (value) => {
            const valueToStore = value instanceof Function ? value(storedValueRef.current) : value;
            safelySetStorage(JSON.stringify(valueToStore));
            setStoredValue(valueToStore);
        },
        [safelySetStorage, storedValueRef],
    );

    return [storedValue, setValue, storedValueRef];
}
