import { useContext, useEffect, useRef, useState } from 'react';

import { pageContext } from '../utils/pageContext';
import { processClientEvent } from '../utils/analyticsEvent';

export const FocusTracking: React.FC<React.PropsWithChildren> = () => {
    const pageCtx = useContext(pageContext);
    const [state, setState] = useState<DocumentVisibilityState>('visible');
    const prevStateRef = useRef<DocumentVisibilityState>();
    const tsRef = useRef(Date.now());

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        const handle = () => setState(document.visibilityState);

        document.addEventListener('visibilitychange', handle, false);

        return () => {
            document.removeEventListener('visibilitychange', handle);
        };
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        if (prevStateRef.current !== state) {
            processClientEvent({
                eventType: 'serviceVisibility',
                session: pageCtx.user ? { user: pageCtx.user } : null,
                additionalData: {
                    visibility: state,
                    visibilityTs: tsRef.current,
                    diff: Date.now() - tsRef.current,
                },
            });
            tsRef.current = Date.now();
            prevStateRef.current = state;
        }
    }, [pageCtx.user, state]);

    return null;
};
