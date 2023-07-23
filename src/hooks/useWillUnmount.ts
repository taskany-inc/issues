import { useEffect, useRef } from 'react';

import { useHandlerSetterRef } from './useHandlerSetterRef';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useWillUnmount(callback?: any) {
    const mountRef = useRef(false);
    const [handler, setHandler] = useHandlerSetterRef(callback);

    useEffect(() => {
        mountRef.current = true;
        const { current: currentHandler } = handler;

        return () => {
            if (currentHandler && mountRef.current) {
                currentHandler();
            }
        };
    }, [handler]);

    return setHandler;
}
