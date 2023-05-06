import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { MouseEventHandler, useCallback, useMemo, useState } from 'react';

import { FilterById } from '../../trpc/inferredTypes';
import { Tag } from '../../graphql/@generated/genql';
import { Priority } from '../types/priority';

export interface QueryState {
    priority: Priority[];
    state: string[];
    tag: string[];
    estimate: string[];
    owner: string[];
    project: string[];
    query: string;
    limit?: number;
}

const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

export const parseFilterValues = (query: ParsedUrlQuery): QueryState => ({
    priority: parseQueryParam(query.priority?.toString()) as Priority[],
    state: parseQueryParam(query.state?.toString()),
    tag: parseQueryParam(query.tag?.toString()),
    estimate: parseQueryParam(query.estimate?.toString()),
    owner: parseQueryParam(query.owner?.toString()),
    project: parseQueryParam(query.project?.toString()),
    query: parseQueryParam(query.query?.toString()).toString(),
    limit: query.limit ? Number(query.limit) : undefined,
});

export const useUrlFilterParams = ({ preset }: { preset?: FilterById }) => {
    const router = useRouter();
    const [currentPreset, setCurrentPreset] = useState(preset);
    const [prevPreset, setPrevPreset] = useState(preset);
    const query = currentPreset ? Object.fromEntries(new URLSearchParams(currentPreset.params)) : router.query;
    const queryState = useMemo<QueryState>(() => parseFilterValues(query), [query]);
    const queryString = router.asPath.split('?')[1];

    if (prevPreset?.id !== preset?.id || prevPreset?._isStarred !== preset?._isStarred) {
        setPrevPreset(preset);
        setCurrentPreset(preset);
    }

    const pushNewState = useCallback(
        ({ priority, state, tag, estimate, owner, project, query, limit }: QueryState) => {
            const newurl = router.asPath.split('?')[0];
            const urlParams = new URLSearchParams();

            priority.length > 0
                ? urlParams.set('priority', Array.from(priority).toString())
                : urlParams.delete('priority');

            state.length > 0 ? urlParams.set('state', Array.from(state).toString()) : urlParams.delete('state');

            tag.length > 0 ? urlParams.set('tag', Array.from(tag).toString()) : urlParams.delete('tag');

            estimate.length > 0
                ? urlParams.set('estimate', Array.from(estimate).toString())
                : urlParams.delete('estimate');

            owner.length > 0 ? urlParams.set('owner', Array.from(owner).toString()) : urlParams.delete('owner');

            project.length > 0 ? urlParams.set('project', Array.from(project).toString()) : urlParams.delete('project');

            query.length > 0 ? urlParams.set('query', query.toString()) : urlParams.delete('query');

            limit ? urlParams.set('limit', limit.toString()) : urlParams.delete('limit');

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

    const resetQueryState = useCallback(() => {
        pushNewState({
            priority: [],
            state: [],
            owner: [],
            project: [],
            tag: [],
            estimate: [],
            query: '',
        });
    }, [pushNewState]);

    const setTagsFilterOutside = useCallback(
        (t: Tag): MouseEventHandler<HTMLDivElement> =>
            (e) => {
                e.preventDefault();
                e.stopPropagation();

                const newTagsFilterValue = new Set(queryState.tag);

                newTagsFilterValue.has(t.id) ? newTagsFilterValue.delete(t.id) : newTagsFilterValue.add(t.id);

                const newSelected = Array.from(newTagsFilterValue);

                pushNewState({
                    ...queryState,
                    tag: newSelected,
                });
            },
        [queryState, pushNewState],
    );

    const setPreset = useCallback(
        (filter: string | undefined | null) => {
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
            setPriorityFilter: pushStateProvider('priority'),
            setStateFilter: pushStateProvider('state'),
            setTagsFilter: pushStateProvider('tag'),
            setEstimateFilter: pushStateProvider('estimate'),
            setOwnerFilter: pushStateProvider('owner'),
            setProjectFilter: pushStateProvider('project'),
            setFulltextFilter: pushStateProvider('query'),
            setLimitFilter: pushStateProvider('limit'),
        }),
        [pushStateProvider],
    );

    return {
        queryState,
        queryString,
        currentPreset,
        setTagsFilterOutside,
        resetQueryState,
        setPreset,
        ...setters,
    };
};
