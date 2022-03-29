import { useEffect } from 'react';
import tinykeys from 'tinykeys';

import { useRouter } from './router';

export const useHotkeys = () => {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = tinykeys(window, {
            'c g': () => router.createGoal(),
            'с п': () => router.createGoal(),

            'c t': () => router.createTeam(),
            'с е': () => router.createTeam(),

            'g h': () => router.index(),
            'п р': () => router.index(),

            'g t': () => router.teams(),
            'п е': () => router.teams(),

            'g g': () => router.goals(),
            'п п': () => router.goals(),

            // 'g b': () => router.boards(),
            // 'п и': () => router.boards(),
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
