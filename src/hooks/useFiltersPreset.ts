import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { deleteCookie } from '@taskany/bricks';

import { trpc } from '../utils/trpcClient';
import { refreshInterval } from '../utils/config';
import { filtersNoSearchPresetCookie } from '../utils/parseUrlParams';

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

    useEffect(() => {
        if (!defaultPresetFallback) {
            deleteCookie(filtersNoSearchPresetCookie);
        }
    }, [defaultPresetFallback]);

    return useMemo(
        () => ({
            preset: preset.data,
            shadowPreset: userFilters.data?.find(
                (f) => decodeURIComponent(f.params) === decodeURIComponent(queryString),
            ),
            userFilters: userFilters.data,
        }),
        [preset.data, userFilters.data, queryString],
    );
};
