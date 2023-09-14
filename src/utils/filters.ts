import {
    parseFilterValues,
    filtersNoSearchPresetCookie,
    isFilterStateEmpty,
    QueryState,
    buildURLSearchParams,
} from '../hooks/useUrlFilterParams';

import { QuartersKeys, createDateRange, encodeUrlDateRange } from './dateTime';
import { SSRProps } from './declareSsrProps';

// TODO: remove here https://github.com/taskany-inc/issues/issues/1657

const decodeLegaceEstimateFilterValue = (data: string): null | { q: QuartersKeys | null; y: string } => {
    try {
        const { q = null, y } = JSON.parse(decodeURIComponent(data));

        if (y) {
            return { q, y };
        }

        return null;
    } catch (e) {
        return null;
    }
};

// TODO: remove here https://github.com/taskany-inc/issues/issues/1657

export const catchLegacyEstimatesRedirect = (queryState: QueryState, req: SSRProps['req']) => {
    const isLegacyEstimate = Boolean(decodeLegaceEstimateFilterValue(queryState.estimate[0]));

    if (isLegacyEstimate) {
        const query = buildURLSearchParams({
            ...queryState,
            estimate: queryState.estimate.reduce<string[]>((acum, raw) => {
                const legacy = decodeLegaceEstimateFilterValue(raw);

                if (legacy) {
                    acum.push(encodeUrlDateRange(createDateRange(Number(legacy.y), legacy.q as QuartersKeys)));
                }

                return acum;
            }, []),
        });

        const base = req.url?.split('?')[0];

        return {
            redirect: {
                destination: `${base}?${query}`,
            },
        };
    }

    return null;
};

export const filtersTakeCount = 5;

export const filtersPanelSsrInit = async ({ query: browserQuery, ssrHelpers, req }: SSRProps) => {
    const browserQueryState = parseFilterValues(browserQuery);
    const isDefaultPreset =
        isFilterStateEmpty(browserQueryState) && !browserQuery.filter && !req.cookies[filtersNoSearchPresetCookie];

    const defaultPreset = isDefaultPreset ? await ssrHelpers.filter.getDefaultFilter.fetch() : undefined;
    const selectedPreset =
        typeof browserQuery.filter === 'string'
            ? await ssrHelpers.filter.getById.fetch(browserQuery.filter)
            : undefined;

    const preset = isDefaultPreset ? defaultPreset : selectedPreset;

    const queryState = preset
        ? parseFilterValues(Object.fromEntries(new URLSearchParams(preset.params)))
        : browserQueryState;

    const redirect = catchLegacyEstimatesRedirect(queryState, req);

    await Promise.all([
        ssrHelpers.user.suggestions.fetch({
            take: filtersTakeCount,
            query: '',
            include: queryState.owner,
        }),
        ssrHelpers.user.suggestions.fetch({
            take: filtersTakeCount,
            query: '',
            include: queryState.participant,
        }),
        ssrHelpers.user.suggestions.fetch({
            take: filtersTakeCount,
            query: '',
            include: queryState.issuer,
        }),
        ssrHelpers.project.suggestions.fetch({
            take: filtersTakeCount,
            query: '',
            include: queryState.project,
        }),
        ssrHelpers.tag.suggestions.fetch({
            take: filtersTakeCount,
            query: '',
            include: queryState.tag,
        }),
        ssrHelpers.state.all.fetch(),
        ssrHelpers.estimates.ranges.fetch(),
        ssrHelpers.filter.getUserFilters.fetch(),
    ]);

    return {
        queryState,
        defaultPresetFallback: isDefaultPreset,
        redirect,
    };
};
