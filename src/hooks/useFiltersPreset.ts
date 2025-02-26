import { useEffect, useMemo } from 'react';
import { deleteCookie } from '@taskany/bricks';

import { trpc } from '../utils/trpcClient';
import { refreshInterval } from '../utils/config';
import { filtersNoSearchPresetCookie } from '../utils/parseUrlParams';

import { useRouter } from './router';

export const useFiltersPreset = ({ defaultPresetFallback = true }: { defaultPresetFallback?: boolean }) => {
    const { appRouter, preset: goToPreset } = useRouter();
    const [baseRoute, queryString] = appRouter.asPath.split('?');

    const userPreset = trpc.filter.getById.useQuery(appRouter.query.filter as string, {
        enabled: !!appRouter.query.filter,
    });
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

    const shadowPreset = useMemo(
        () =>
            userFilters.data?.find(
                (f) => decodeURIComponent(f.params) === decodeURIComponent(queryString) && baseRoute === f.target,
            ),
        [baseRoute, userFilters, queryString],
    );

    useEffect(() => {
        if (shadowPreset) {
            goToPreset(shadowPreset.id, shadowPreset.target ?? '');
        }
    }, [shadowPreset, goToPreset]);

    return useMemo(
        () => ({
            preset: preset.data,
            userFilters: userFilters.data,
        }),
        [preset.data, userFilters.data],
    );
};
