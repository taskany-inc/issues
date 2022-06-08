import { useEffect, useState } from 'react';

export const useMounted = (delay: number) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const lazySubsTimer = setTimeout(() => setMounted(true), delay);

        return () => clearInterval(lazySubsTimer);
    }, [delay]);

    return mounted;
};
