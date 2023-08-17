import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { trpc } from '../utils/trpcClient';
import { refreshInterval } from '../utils/config';

import { useCookies } from './useCookies';
import { filtersNoSearchPresetCookie } from './useUrlFilterParams';

export const useFiltersPreset = () => {
    const router = useRouter();
    const queryString = router.asPath.split('?')[1];

    const { getCookie, deleteCookie } = useCookies();

    const emptySearchCookie = getCookie(filtersNoSearchPresetCookie);
    const shouldApplyDefaultPreset = !emptySearchCookie && !queryString?.length;

    const userPreset = trpc.filter.getById.useQuery(router.query.filter as string, { enabled: !!router.query.filter });
    const defaultPreseet = trpc.filter.getDefaultFilter.useQuery(undefined, {
        enabled: shouldApplyDefaultPreset,
    });

    const preset = shouldApplyDefaultPreset ? defaultPreseet : userPreset;

    const userFilters = trpc.filter.getUserFilters.useQuery(undefined, {
        keepPreviousData: true,
        staleTime: refreshInterval,
    });

    const shadowPreset = userFilters.data?.filter(
        (f) => decodeURIComponent(f.params) === decodeURIComponent(queryString),
    )[0];

    useEffect(() => {
        if (emptySearchCookie) {
            deleteCookie(filtersNoSearchPresetCookie);
        }
    }, [emptySearchCookie, deleteCookie]);

    return {
        preset: preset.data,
        shadowPreset,
        userFilters: userFilters.data,
    };
};
