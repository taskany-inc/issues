import { useEffect, useRef } from 'react';
import { NextRouter } from 'next/router';
import { PageLoadProgressRef } from '@taskany/bricks';

export const usePageLoad = (router: NextRouter): React.RefObject<PageLoadProgressRef> => {
    const ref = useRef<PageLoadProgressRef>(null);

    useEffect(() => {
        if (ref.current) {
            const methods = ref.current;

            router.events.on('routeChangeStart', methods.start);
            router.events.on('routeChangeComplete', methods.done);
            router.events.on('routeChangeError', methods.done);

            return () => {
                router.events.on('routeChangeStart', methods.start);
                router.events.on('routeChangeComplete', methods.done);
                router.events.on('routeChangeError', methods.done);
            };
        }
    }, [router]);

    return ref;
};
