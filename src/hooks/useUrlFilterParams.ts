import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { StateType, Tag } from '@prisma/client';

import { FilterById } from '../../trpc/inferredTypes';
import { SortDirection, SortableProps } from '../components/SortFilter/SortFilter';
import { StateTypeEnum } from '../schema/common';
import { setCookie } from '../utils/cookies';

export const filtersNoSearchPresetCookie = 'taskany.NoSearchPreset';

// TODO: replace it with QueryWithFilters from schema/common
export interface QueryState {
    priority: string[];
    state: string[];
    stateType: StateType[];
    tag: string[];
    estimate: string[];
    issuer: string[];
    owner: string[];
    participant: string[];
    project: string[];
    query: string;
    starred: boolean;
    watching: boolean;
    sort: Record<SortableProps, NonNullable<SortDirection>> | Record<string, never>;
    limit?: number;
}

const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

const parseSortQueryParam = (param = '') =>
    param.split(',').reduce((acc, curr) => {
        if (curr) {
            const [id, direction] = curr.split(':');
            acc[id as SortableProps] = direction as NonNullable<SortDirection>;
        }
        return acc;
    }, {} as Record<SortableProps, NonNullable<SortDirection>>);

const stringifySortQueryParam = (param: QueryState['sort']) =>
    Object.entries(param)
        .map(([id, direction]) => `${id}:${direction}`)
        .join(',');

const buildURLSearchParams = ({
    priority,
    state,
    stateType,
    tag,
    estimate,
    issuer,
    owner,
    participant,
    project,
    query,
    starred,
    watching,
    sort,
    limit,
}: QueryState): URLSearchParams => {
    const urlParams = new URLSearchParams();

    priority.length > 0 ? urlParams.set('priority', Array.from(priority).toString()) : urlParams.delete('priority');

    state.length > 0 ? urlParams.set('state', Array.from(state).toString()) : urlParams.delete('state');

    stateType.length > 0 ? urlParams.set('stateType', Array.from(stateType).toString()) : urlParams.delete('stateType');

    tag.length > 0 ? urlParams.set('tag', Array.from(tag).toString()) : urlParams.delete('tag');

    estimate.length > 0 ? urlParams.set('estimate', Array.from(estimate).toString()) : urlParams.delete('estimate');

    owner.length > 0 ? urlParams.set('owner', Array.from(owner).toString()) : urlParams.delete('owner');

    issuer.length > 0 ? urlParams.set('issuer', Array.from(issuer).toString()) : urlParams.delete('issuer');

    participant.length > 0
        ? urlParams.set('participant', Array.from(participant).toString())
        : urlParams.delete('participant');

    project.length > 0 ? urlParams.set('project', Array.from(project).toString()) : urlParams.delete('project');

    Object.keys(sort).length > 0 ? urlParams.set('sort', stringifySortQueryParam(sort)) : urlParams.delete('sort');

    query.length > 0 ? urlParams.set('query', query.toString()) : urlParams.delete('query');

    starred ? urlParams.set('starred', '1') : urlParams.delete('starred');

    watching ? urlParams.set('watching', '1') : urlParams.delete('watching');

    limit ? urlParams.set('limit', limit.toString()) : urlParams.delete('limit');

    return urlParams;
};

export const isFilterStateEmpty = (state: QueryState): boolean => !Array.from(buildURLSearchParams(state)).length;

export const parseFilterValues = (query: ParsedUrlQuery): QueryState => ({
    priority: parseQueryParam(query.priority?.toString()),
    state: parseQueryParam(query.state?.toString()),
    stateType: parseQueryParam(query.stateType?.toString()).map((type) => StateTypeEnum.parse(type)),
    tag: parseQueryParam(query.tag?.toString()),
    estimate: parseQueryParam(query.estimate?.toString()),
    issuer: parseQueryParam(query.issuer?.toString()),
    owner: parseQueryParam(query.owner?.toString()),
    participant: parseQueryParam(query.participant?.toString()),
    project: parseQueryParam(query.project?.toString()),
    query: parseQueryParam(query.query?.toString()).toString(),
    starred: Boolean(parseInt(parseQueryParam(query.starred?.toString()).toString(), 10)),
    watching: Boolean(parseInt(parseQueryParam(query.watching?.toString()).toString(), 10)),
    sort: parseSortQueryParam(query.sort?.toString()),
    limit: query.limit ? Number(query.limit) : undefined,
});

export const useUrlFilterParams = ({ preset }: { preset?: FilterById }) => {
    const router = useRouter();
    const [currentPreset, setCurrentPreset] = useState(preset);
    const [prevPreset, setPrevPreset] = useState(preset);
    const queryState = useMemo<QueryState>(() => {
        const query = currentPreset ? Object.fromEntries(new URLSearchParams(currentPreset.params)) : router.query;
        return parseFilterValues(query);
    }, [router.query, currentPreset]);
    const queryString = router.asPath.split('?')[1];

    if (prevPreset?.id !== preset?.id || prevPreset?._isStarred !== preset?._isStarred) {
        setPrevPreset(preset);
        setCurrentPreset(preset);
    }

    const pushStateToRouter = useCallback(
        (queryState: QueryState) => {
            const newurl = router.asPath.split('?')[0];
            const urlParams = buildURLSearchParams(queryState);
            const isEmptySearch = !Array.from(urlParams.keys()).length;

            if (isEmptySearch) {
                setCookie(filtersNoSearchPresetCookie, true, {
                    'max-age': 30,
                });
            }

            router.push(!isEmptySearch ? `${newurl}?${urlParams}` : newurl);
        },
        [router],
    );

    const pushStateProvider = useMemo(() => {
        const state = { ...queryState };
        let queued = false;

        return <T extends keyof QueryState>(key: T) =>
            (value: QueryState[T]) => {
                state[key] = value;

                if (!queued) {
                    queued = true;
                    // we batch state changes due current call stack
                    // and will push it to router together in microtask queue.

                    // Example
                    // setPriorityFilter([priority]);
                    // setStateTypeFilter([typeA, typeB]);

                    // ...will produce one router push

                    queueMicrotask(() => {
                        pushStateToRouter(state);
                    });
                }
            };
    }, [queryState, pushStateToRouter]);

    const resetQueryState = useCallback(() => {
        pushStateToRouter({
            priority: [],
            state: [],
            stateType: [],
            issuer: [],
            owner: [],
            participant: [],
            project: [],
            tag: [],
            estimate: [],
            starred: false,
            watching: false,
            query: '',
            sort: {},
        });
    }, [pushStateToRouter]);

    const setTagsFilterOutside = useCallback(
        (t: Tag): MouseEventHandler<HTMLDivElement> =>
            (e) => {
                e.preventDefault();
                e.stopPropagation();

                const newTagsFilterValue = new Set(queryState.tag);

                newTagsFilterValue.has(t.id) ? newTagsFilterValue.delete(t.id) : newTagsFilterValue.add(t.id);

                const newSelected = Array.from(newTagsFilterValue);

                pushStateToRouter({
                    ...queryState,
                    tag: newSelected,
                });
            },
        [queryState, pushStateToRouter],
    );

    const setPreset = useCallback(
        (filter: string | undefined | null) => {
            router.push({
                pathname: router.asPath.split('?')[0],
                query: filter
                    ? {
                          filter,
                      }
                    : {},
            });
        },
        [router],
    );

    const setters = useMemo(
        () => ({
            setPriorityFilter: pushStateProvider('priority'),
            setStateFilter: pushStateProvider('state'),
            setStateTypeFilter: pushStateProvider('stateType'),
            setTagsFilter: pushStateProvider('tag'),
            setEstimateFilter: pushStateProvider('estimate'),
            setIssuerFilter: pushStateProvider('issuer'),
            setOwnerFilter: pushStateProvider('owner'),
            setParticipantFilter: pushStateProvider('participant'),
            setProjectFilter: pushStateProvider('project'),
            setStarredFilter: pushStateProvider('starred'),
            setWatchingFilter: pushStateProvider('watching'),
            setSortFilter: pushStateProvider('sort'),
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
