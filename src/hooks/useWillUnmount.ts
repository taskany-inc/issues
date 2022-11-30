import { useEffect, useRef } from 'react';

import { useHandlerSetterRef } from './useHandlerSetterRef';

export function useWillUnmount(callback?: any) {
    const mountRef = useRef(false);
    const [handler, setHandler] = useHandlerSetterRef(callback);

    useEffect(() => {
        mountRef.current = true;

        return () => {
            if (handler?.current && mountRef.current) {
                handler.current();
            }
        };
    }, []);

    return setHandler;
}
