import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { PageLoadProgressRef } from '@taskany/bricks/harmony';

export const usePageLoad = () => {
    const pageLoadingRef = useRef<PageLoadProgressRef>(null);
    const router = useRouter();
    const [progress, setProgress] = useState(false);

    // it can be window.location.pathname or react-router-dom as well
    const [prevLoc, setPrevLoc] = useState(router.pathname);

    useEffect(() => {
        setProgress(router.pathname !== prevLoc);
    }, [router, prevLoc]);

    useEffect(() => {
        if (router.pathname !== prevLoc) setPrevLoc(router.pathname);
    }, [router, prevLoc]);

    useEffect(() => {
        progress ? pageLoadingRef.current?.start() : pageLoadingRef.current?.done();
    }, [progress]);

    return pageLoadingRef;
};
