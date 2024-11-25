import { useRouter } from 'next/router';
import { MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { setCookie } from '@taskany/bricks';

import { FilterById } from '../../trpc/inferredTypes';
import {
    groupByValue,
    pageViewValue,
    parseQueryState,
    buildURLSearchParams,
    QueryState,
    filtersNoSearchPresetCookie,
} from '../utils/parseUrlParams';

type GroupByParam = keyof typeof groupByValue;
type PageView = keyof typeof pageViewValue;

export const useUrlFilterParams = ({ preset }: { preset?: FilterById }) => {
    const router = useRouter();
    const [currentPreset, setCurrentPreset] = useState(preset);
    const [prevPreset, setPrevPreset] = useState(preset);
    const { queryState, queryFilterState, projectsSort, groupBy, hideCriteria, hideEmptyProjects, view } =
        useMemo(() => {
            const query = currentPreset ? Object.fromEntries(new URLSearchParams(currentPreset.params)) : router.query;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { groupBy, view, id, ...queries } = query;

            const { queryState = undefined, queryFilterState = undefined } = Object.keys(queries).length
                ? parseQueryState({ groupBy, view, ...queries })
                : {};

            return {
                queryFilterState,
                queryState,
                groupBy: groupBy as GroupByParam | undefined,
                view: view as PageView | undefined,
                hideCriteria: queryState?.hideCriteria,
                projectsSort: queryState?.projectsSort,
                hideEmptyProjects: queryState?.hideEmptyProjects,
            };
        }, [router.query, currentPreset]);

    const queryString = router.asPath.split('?')[1];

    if (prevPreset?.id !== preset?.id || prevPreset?._isStarred !== preset?._isStarred) {
        setPrevPreset(preset);
        setCurrentPreset(preset);
    }

    const pushStateToRouter = useCallback(
        (queryState: Partial<QueryState>) => {
            const newUrl = router.asPath.split('?')[0];
            const urlParams = buildURLSearchParams({ groupBy, view, ...queryState });

            const isEmptySearch = !Array.from(urlParams.keys()).length;

            if (isEmptySearch) {
                setCookie(filtersNoSearchPresetCookie, true, {
                    'max-age': 30,
                });
            }

            router.push(!isEmptySearch ? `${newUrl}?${urlParams}` : newUrl);
        },
        [groupBy, view, router],
    );

    const pushStateProvider = useMemo(() => {
        const state = { ...queryState };
        let queued = false;

        const push = (nextState: Partial<QueryState>) => {
            if (!queued) {
                queued = true;
                // we batch state changes due current call stack
                // and will push it to router together in microtask queue.

                // Example
                // setPriorityFilter([priority]);
                // setStateTypeFilter([typeA, typeB]);

                // ...will produce one router push
                queueMicrotask(() => {
                    pushStateToRouter(nextState);
                });
            }
        };

        return {
            key:
                <T extends keyof QueryState>(key: T) =>
                (value?: QueryState[T]) => {
                    state[key] = value;

                    push(state);
                },
            batch: () => (nextState: Partial<QueryState>) => {
                push({
                    ...state,
                    ...nextState,
                });
            },
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
            partnershipProject: [],
            tag: [],
            estimate: [],
            starred: false,
            watching: false,
            query: '',
            sort: [],
            projectsSort: [],
            groupBy: undefined,
            view: undefined,
            hideCriteria: undefined,
            hideEmptyProjects: undefined,
        });
    }, [pushStateToRouter]);

    const setTagsFilterOutside = useCallback(
        (tag: { id: string }): MouseEventHandler<HTMLDivElement> =>
            (e) => {
                e.preventDefault();
                e.stopPropagation();

                const newTagsFilterValue = new Set(queryState?.tag);

                newTagsFilterValue.has(tag.id) ? newTagsFilterValue.delete(tag.id) : newTagsFilterValue.add(tag.id);

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
            setPriorityFilter: pushStateProvider.key('priority'),
            setStateFilter: pushStateProvider.key('state'),
            setStateTypeFilter: pushStateProvider.key('stateType'),
            setTagsFilter: pushStateProvider.key('tag'),
            setEstimateFilter: pushStateProvider.key('estimate'),
            setIssuerFilter: pushStateProvider.key('issuer'),
            setOwnerFilter: pushStateProvider.key('owner'),
            setParticipantFilter: pushStateProvider.key('participant'),
            setProjectFilter: pushStateProvider.key('project'),
            setPartnershipProjectFilter: pushStateProvider.key('partnershipProject'),
            setStarredFilter: pushStateProvider.key('starred'),
            setWatchingFilter: pushStateProvider.key('watching'),
            setSortFilter: pushStateProvider.key('sort'),
            setProjectsSortFilter: pushStateProvider.key('projectsSort'),
            setFulltextFilter: pushStateProvider.key('query'),
            setLimitFilter: pushStateProvider.key('limit'),
            setGroupBy: pushStateProvider.key('groupBy'),
            setView: pushStateProvider.key('view'),
            setHideCriteria: pushStateProvider.key('hideCriteria'),
            setHideEmptyProjects: pushStateProvider.key('hideEmptyProjects'),
            batchQueryState: pushStateProvider.batch(),
        }),
        [pushStateProvider],
    );

    return {
        queryState,
        projectsSort,
        queryFilterState,
        queryString,
        currentPreset,
        groupBy,
        hideCriteria,
        hideEmptyProjects,
        setTagsFilterOutside,
        resetQueryState,
        setPreset,
        view,
        ...setters,
    };
};
