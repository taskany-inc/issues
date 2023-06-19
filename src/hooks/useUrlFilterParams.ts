import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { Tag } from '@prisma/client';

import { FilterById } from '../../trpc/inferredTypes';
import { Priority } from '../types/priority';
import { SortDirection, SortableProps } from '../components/SortFilter/SortFilter';

// TODO: replace it with QueryWithFilters from schema/common
export interface QueryState {
    priority: string[];
    state: string[];
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

export const parseFilterValues = (query: ParsedUrlQuery): QueryState => ({
    priority: parseQueryParam(query.priority?.toString()) as Priority[],
    state: parseQueryParam(query.state?.toString()),
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
    const query = currentPreset ? Object.fromEntries(new URLSearchParams(currentPreset.params)) : router.query;
    const queryState = useMemo<QueryState>(() => parseFilterValues(query), [query]);
    const queryString = router.asPath.split('?')[1];

    if (prevPreset?.id !== preset?.id || prevPreset?._isStarred !== preset?._isStarred) {
        setPrevPreset(preset);
        setCurrentPreset(preset);
    }

    const pushNewState = useCallback(
        ({
            priority,
            state,
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
        }: QueryState) => {
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

            issuer.length > 0 ? urlParams.set('issuer', Array.from(issuer).toString()) : urlParams.delete('issuer');

            participant.length > 0
                ? urlParams.set('participant', Array.from(participant).toString())
                : urlParams.delete('participant');

            project.length > 0 ? urlParams.set('project', Array.from(project).toString()) : urlParams.delete('project');

            Object.keys(sort).length > 0
                ? urlParams.set('sort', stringifySortQueryParam(sort))
                : urlParams.delete('sort');

            query.length > 0 ? urlParams.set('query', query.toString()) : urlParams.delete('query');

            starred ? urlParams.set('starred', '1') : urlParams.delete('starred');

            watching ? urlParams.set('watching', '1') : urlParams.delete('watching');

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
