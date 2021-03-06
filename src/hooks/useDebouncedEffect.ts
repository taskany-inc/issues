import { useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useDebouncedEffect = (effect: () => void, delay: number, deps: any[] = []) => {
    useEffect(() => {
        const handler = setTimeout(() => effect(), delay);

        return () => clearTimeout(handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, effect, delay]);
};
