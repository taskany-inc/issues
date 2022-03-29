import { useEffect } from 'react';
import tinykeys from 'tinykeys';

import { useRouter } from './router';

export const useHotkeys = () => {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = tinykeys(window, {
            'c g': () => router.createGoal(),
            'c t': () => router.createTeam(),
        });
        return () => {
            unsubscribe();
        };
    });
};

export const useHotkey = (key: string, cb: () => void) => {
    useEffect(() => {
        const unsubscribe = tinykeys(window, {
            [key]: () => cb(),
        });
        return () => {
            unsubscribe();
        };
    });
};
