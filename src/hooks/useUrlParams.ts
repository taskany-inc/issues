import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { defaultLimit } from '../components/LimitFilter';

import { useMounted } from './useMounted';

const refreshInterval = 3000;

export const useUrlParams = (
    stateFilter: string[],
    tagsFilter: string[],
    ownerFilter: string[],
    fulltextFilter: string,
    limitFilter: number,
) => {
    const router = useRouter();
    const mounted = useMounted(refreshInterval);

    useEffect(() => {
        const newurl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        const urlParams = new URLSearchParams(router.query as unknown as string);
        if (!mounted) {
            return;
        }
        if (
            stateFilter.length > 0 ||
            tagsFilter.length > 0 ||
            ownerFilter.length > 0 ||
            fulltextFilter.length > 0 ||
            limitFilter !== defaultLimit
        ) {
            stateFilter.length > 0
                ? urlParams.set('state', Array.from(stateFilter).toString())
                : urlParams.delete('state');
            tagsFilter.length > 0 ? urlParams.set('tags', Array.from(tagsFilter).toString()) : urlParams.delete('tags');
            ownerFilter.length > 0
                ? urlParams.set('user', Array.from(ownerFilter).toString())
                : urlParams.delete('user');
            fulltextFilter.length > 0 ? urlParams.set('search', fulltextFilter) : urlParams.delete('search');
            urlParams.set('limit', limitFilter.toString());
            window.history.pushState({ path: `${newurl}?${urlParams}` }, '', `${newurl}?${urlParams}`);
        } else {
            window.history.pushState({ path: newurl }, '', newurl);
        }
    }, [stateFilter, mounted, ownerFilter, tagsFilter, limitFilter, fulltextFilter, router.query]);
};
