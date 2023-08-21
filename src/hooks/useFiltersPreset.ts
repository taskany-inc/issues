import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { trpc } from '../utils/trpcClient';
import { deleteCookie } from '../utils/cookies';
import { refreshInterval } from '../utils/config';

import { filtersNoSearchPresetCookie } from './useUrlFilterParams';

export const useFiltersPreset = ({ defaultPresetFallback = true }: { defaultPresetFallback?: boolean }) => {
    const router = useRouter();
    const queryString = router.asPath.split('?')[1];

    const userPreset = trpc.filter.getById.useQuery(router.query.filter as string, { enabled: !!router.query.filter });
    const defaultPreset = trpc.filter.getDefaultFilter.useQuery(undefined, {
        enabled: defaultPresetFallback,
    });

    const preset = defaultPresetFallback ? defaultPreset : userPreset;

    const userFilters = trpc.filter.getUserFilters.useQuery(undefined, {
        keepPreviousData: true,
        staleTime: refreshInterval,
    });

    const shadowPreset = userFilters.data?.filter(
        (f) => decodeURIComponent(f.params) === decodeURIComponent(queryString),
    )[0];

    useEffect(() => {
        if (!defaultPresetFallback) {
            deleteCookie(filtersNoSearchPresetCookie);
        }
    }, [defaultPresetFallback]);

    return {
        preset: preset.data,
        shadowPreset,
        userFilters: userFilters.data,
    };
};
