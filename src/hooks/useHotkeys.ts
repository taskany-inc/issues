import { useEffect } from 'react';
import tinykeys from 'tinykeys';
import { createHotkeys, showHomeKeys, showProjectsKeys, showGoalsKeys } from '../utils/hotkeys';

import { useRouter } from './router';

export const useHotkeys = () => {
    const router = useRouter();

    useEffect(() =>
        tinykeys(
            window,
            createHotkeys(
                [showHomeKeys, () => router.index()],
                [showProjectsKeys, () => router.projects()],
                [showGoalsKeys, () => router.goals()],
            ),
        ),
    );
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
