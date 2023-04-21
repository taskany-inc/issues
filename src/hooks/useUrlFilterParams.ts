import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { MouseEventHandler, useCallback, useMemo, useState } from 'react';

import { Filter, Tag } from '../../graphql/@generated/genql';
import { Priority } from '../types/priority';

export interface QueryState {
    priorityFilter: Priority[];
    stateFilter: string[];
    tagsFilter: string[];
    estimateFilter: string[];
    ownerFilter: string[];
    projectFilter: string[];
    fulltextFilter: string;
    limitFilter?: number;
}

const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

export const parseFilterValues = (query: ParsedUrlQuery): QueryState => ({
    priorityFilter: parseQueryParam(query.priority?.toString()) as Priority[],
    stateFilter: parseQueryParam(query.state?.toString()),
    tagsFilter: parseQueryParam(query.tags?.toString()),
    estimateFilter: parseQueryParam(query.estimates?.toString()),
    ownerFilter: parseQueryParam(query.user?.toString()),
    projectFilter: parseQueryParam(query.projects?.toString()),
    fulltextFilter: parseQueryParam(query.search?.toString()).toString(),
    limitFilter: query.limit ? Number(query.limit) : undefined,
});

export const useUrlFilterParams = ({ preset }: { preset?: Filter }) => {
    const router = useRouter();
    const [currentPreset, setCurrentPreset] = useState(preset);
    const [prevPreset, setPrevPreset] = useState(preset);
    const query = currentPreset ? Object.fromEntries(new URLSearchParams(currentPreset.params)) : router.query;
    const queryState = useMemo<QueryState>(() => parseFilterValues(query), [query]);
    const queryString = router.asPath.split('?')[1];

    if (prevPreset !== preset) {
        setPrevPreset(preset);
        setCurrentPreset(preset);
    }

    const pushNewState = useCallback(
        ({
            priorityFilter,
            stateFilter,
            tagsFilter,
            estimateFilter,
            ownerFilter,
            projectFilter,
            fulltextFilter,
            limitFilter,
        }: QueryState) => {
            const newurl = router.asPath.split('?')[0];
            const urlParams = new URLSearchParams();

            priorityFilter.length > 0
                ? urlParams.set('priority', Array.from(priorityFilter).toString())
                : urlParams.delete('priority');

            stateFilter.length > 0
                ? urlParams.set('state', Array.from(stateFilter).toString())
                : urlParams.delete('state');

            tagsFilter.length > 0 ? urlParams.set('tags', Array.from(tagsFilter).toString()) : urlParams.delete('tags');

            estimateFilter.length > 0
                ? urlParams.set('estimates', Array.from(estimateFilter).toString())
                : urlParams.delete('estimates');

            ownerFilter.length > 0
                ? urlParams.set('user', Array.from(ownerFilter).toString())
                : urlParams.delete('user');

            projectFilter.length > 0
                ? urlParams.set('projects', Array.from(projectFilter).toString())
                : urlParams.delete('projects');

            fulltextFilter.length > 0 ? urlParams.set('search', fulltextFilter.toString()) : urlParams.delete('search');

            limitFilter ? urlParams.set('limit', limitFilter.toString()) : urlParams.delete('limit');

            router.push(Array.from(urlParams.keys()).length ? `${newurl}?${urlParams}` : newurl);
        },
        [router],
    );

    const pushStateProvider = useCallback(
        <T extends keyof QueryState>(key: T) =>
            (value: QueryState[T]) => {
                setCurrentPreset(undefined);
                pushNewState({
                    ...queryState,
                    [key]: value,
                });
            },
        [pushNewState, queryState],
    );

    const setTagsFilterOutside = useCallback(
        (t: Tag): MouseEventHandler<HTMLDivElement> =>
            (e) => {
                e.preventDefault();
                e.stopPropagation();

                const newTagsFilterValue = new Set(queryState.tagsFilter);

                newTagsFilterValue.has(t.id) ? newTagsFilterValue.delete(t.id) : newTagsFilterValue.add(t.id);

                const newSelected = Array.from(newTagsFilterValue);

                pushNewState({
                    ...queryState,
                    tagsFilter: newSelected,
                });
            },
        [queryState, pushNewState],
    );

    const setPreset = useCallback(
        (filter: string | undefined) => {
            router.push({
                pathname: router.asPath.split('?')[0],
                query: {
                    filter,
                },
            });
        },
        [router],
    );

    const setters = useMemo(
        () => ({
            setPriorityFilter: pushStateProvider('priorityFilter'),
            setStateFilter: pushStateProvider('stateFilter'),
            setTagsFilter: pushStateProvider('tagsFilter'),
            setEstimateFilter: pushStateProvider('estimateFilter'),
            setOwnerFilter: pushStateProvider('ownerFilter'),
            setProjectFilter: pushStateProvider('projectFilter'),
            setFulltextFilter: pushStateProvider('fulltextFilter'),
            setLimitFilter: pushStateProvider('limitFilter'),
        }),
        [pushStateProvider],
    );

    return {
        queryState,
        queryString,
        currentPreset,
        setTagsFilterOutside,
        setPreset,
        ...setters,
    };
};
