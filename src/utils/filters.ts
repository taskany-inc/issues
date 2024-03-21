import { filtersNoSearchPresetCookie, buildURLSearchParams, parseQueryState } from '../hooks/useUrlFilterParams';

import { SSRProps } from './declareSsrProps';

export const filtersTakeCount = 5;

export const filtersPanelSsrInit = async ({ query, ssrHelpers, req }: SSRProps) => {
    const { queryState: browserQueryState } = parseQueryState(query);
    const isDefaultPreset =
        !Array.from(buildURLSearchParams(browserQueryState)).length &&
        !query.filter &&
        !req.cookies[filtersNoSearchPresetCookie];

    const defaultPreset = isDefaultPreset ? await ssrHelpers.filter.getDefaultFilter.fetch() : undefined;
    const selectedPreset =
        typeof query.filter === 'string' ? await ssrHelpers.filter.getById.fetch(query.filter) : undefined;

    const preset = isDefaultPreset ? defaultPreset : selectedPreset;

    const queryState = preset
        ? parseQueryState(Object.fromEntries(new URLSearchParams(preset.params))).queryState
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
    ]);

    return {
        queryState,
        defaultPresetFallback: isDefaultPreset,
    };
};
