import { useContext, useEffect } from 'react';

import { EventType, processClientEvent } from '../utils/analyticsEvent';
import { pageContext } from '../utils/pageContext';

export const useClientEvent = (
    eventName: EventType,
    additionalData?: Record<string, string | number | boolean | null>,
    disabled = false,
) => {
    const pageCtx = useContext(pageContext);

    useEffect(() => {
        if (!disabled) {
            processClientEvent({
                eventType: eventName,
                session: pageCtx.user ? { user: pageCtx.user } : null,
                additionalData,
            });
        }
    }, [additionalData, disabled, eventName, pageCtx.user]);
};
