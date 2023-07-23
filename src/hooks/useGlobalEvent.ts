import { useEffect } from 'react';

import { useHandlerSetterRef } from './useHandlerSetterRef';

/**
 * Accepts an event name then returns a callback setter for a function to be performed when the event triggers.
 */
export const useGlobalEvent = <E extends Event>(
    eventName: keyof WindowEventMap,
    fn?: (event: E) => void,
    opts?: AddEventListenerOptions,
) => {
    const [handler, setHandler] = useHandlerSetterRef(fn);
    // @ts-ignore
    handler.current = fn;

    useEffect(() => {
        // @ts-ignore
        const cb: EventListenerOrEventListenerObject = (event: E) => {
            if (handler.current) {
                handler.current(event);
            }
        };

        if (handler && eventName) {
            window.addEventListener(eventName, cb, opts);
        }

        return () => {
            if (eventName) {
                window.removeEventListener(eventName, cb, opts);
            }
        };
    }, [handler, eventName, opts]);

    return setHandler;
};
