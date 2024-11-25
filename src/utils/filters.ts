import { filtersNoSearchPresetCookie, buildURLSearchParams, parseQueryState } from './parseUrlParams';
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
        ssrHelpers.user.getFilterUsersByIds.fetch(queryState.owner ?? []),
        ssrHelpers.user.getFilterUsersByIds.fetch(queryState.participant ?? []),
        ssrHelpers.user.getFilterUsersByIds.fetch(queryState.issuer ?? []),
        ssrHelpers.project.getByIds.fetch({ ids: queryState.project ?? [] }),
        ssrHelpers.tag.getByIds.fetch(queryState.tag ?? []),
        ssrHelpers.state.all.fetch(),
    ]);

    return {
        queryState,
        defaultPresetFallback: isDefaultPreset,
    };
};
