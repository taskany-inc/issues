import { parseFilterValues, filtersNoSearchPresetCookie, isFilterStateEmpty } from '../hooks/useUrlFilterParams';

import { SSRProps } from './declareSsrProps';

export const filtersTakeCount = 5;

export const filtersPanelSsrInit = async ({ query: browserQuery, ssrHelpers, req }: SSRProps) => {
    const browserQueryState = parseFilterValues(browserQuery);
    const isDefaultPreset = isFilterStateEmpty(browserQueryState) && !req.cookies[filtersNoSearchPresetCookie];

    const defaultPreset = isDefaultPreset ? await ssrHelpers.filter.getDefaultFilter.fetch() : undefined;
    const selectedPreset =
        browserQuery.filter === 'string' ? await ssrHelpers.filter.getById.fetch(browserQuery.filter) : undefined;

    const preset = isDefaultPreset ? defaultPreset : selectedPreset;

    const queryState = preset
        ? parseFilterValues(Object.fromEntries(new URLSearchParams(preset.params)))
        : browserQueryState;

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
        ssrHelpers.estimates.all.fetch(),
        ssrHelpers.filter.getUserFilters.fetch(),
    ]);

    return queryState;
};
