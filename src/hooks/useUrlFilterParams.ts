import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { setCookie } from '@taskany/bricks';

import { FilterById, StateType } from '../../trpc/inferredTypes';
import { SortableProjectsPropertiesArray, StateTypeEnum } from '../schema/common';

export type SortDirection = 'asc' | 'desc';
export type SortableGoalsProps =
    | 'title'
    | 'state'
    | 'priority'
    | 'project'
    | 'activity'
    | 'owner'
    | 'updatedAt'
    | 'createdAt';

export type SortableProjectsProps = NonNullable<SortableProjectsPropertiesArray>[number]['key'];

export type SortableBaseProps = SortableGoalsProps & SortableProjectsProps;

export const filtersNoSearchPresetCookie = 'taskany.NoSearchPreset';

// TODO: replace it with QueryWithFilters from schema/common
export interface FilterQueryState {
    priority: string[];
    state: string[];
    stateType: StateType[];
    tag: string[];
    estimate: string[];
    issuer: string[];
    owner: string[];
    participant: string[];
    project: string[];
    partnershipProject: string[];
    query: string;
    sort: Array<{ key: SortableGoalsProps; dir: SortDirection }>;
    projectsSort: NonNullable<SortableProjectsPropertiesArray>;
    hideCriteria?: boolean;
    hideEmptyProjects?: boolean;
}

const groupByValue = {
    project: true,
};

type GroupByParam = keyof typeof groupByValue;

const pageViewValue = {
    kanban: true,
    list: true,
};

export type PageView = keyof typeof pageViewValue;

interface BaseQueryState {
    starred: boolean;
    watching: boolean;
    groupBy?: GroupByParam;
    view?: PageView;
    limit?: number;
}

const valueIsGroupByParam = (value: string): value is GroupByParam => {
    return value in groupByValue;
};

const parseGroupByParam = (value?: string): GroupByParam | undefined => {
    if (!value) {
        return undefined;
    }

    return valueIsGroupByParam(value) ? value : undefined;
};

const valueIsViewParam = (value: string): value is PageView => {
    return value in pageViewValue;
};

const parseViewParam = (value?: string): PageView | undefined => {
    if (!value) {
        return undefined;
    }

    return valueIsViewParam(value) ? value : undefined;
};

export interface QueryState extends BaseQueryState, FilterQueryState {}

const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

const parseSortQueryParam = <K extends 'goals' | 'projects'>(param = '') =>
    param.split(',').reduce((acc, curr) => {
        if (curr) {
            const [key, dir] = curr.split(':') as [
                K extends 'goals' ? SortableGoalsProps : SortableProjectsProps,
                SortDirection,
            ];
            acc.push({ key: key as SortableBaseProps, dir });
        }
        return acc;
    }, [] as K extends 'goals' ? QueryState['sort'] : QueryState['projectsSort']);

const stringifySortQueryParam = (param: QueryState['sort' | 'projectsSort']) =>
    param.map(({ key, dir }) => `${key}:${dir}`).join(',');

export const buildURLSearchParams = ({
    priority = [],
    state = [],
    stateType = [],
    tag = [],
    estimate = [],
    owner = [],
    issuer = [],
    participant = [],
    project = [],
    partnershipProject = [],
    query = '',
    starred,
    watching,
    sort = [],
    projectsSort = [],
    groupBy,
    view,
    limit,
    hideCriteria,
    hideEmptyProjects,
}: Partial<QueryState>): URLSearchParams => {
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

    partnershipProject.length > 0
        ? urlParams.set('partnershipProject', Array.from(project).toString())
        : urlParams.delete('partnershipProject');

    sort.length > 0 ? urlParams.set('sort', stringifySortQueryParam(sort)) : urlParams.delete('sort');

    projectsSort.length > 0
        ? urlParams.set('projectsSort', stringifySortQueryParam(projectsSort))
        : urlParams.delete('projectsSort');

    query.length > 0 ? urlParams.set('query', query.toString()) : urlParams.delete('query');

    starred ? urlParams.set('starred', '1') : urlParams.delete('starred');

    watching ? urlParams.set('watching', '1') : urlParams.delete('watching');

    groupBy === 'project' ? urlParams.set('groupBy', groupBy) : urlParams.delete('groupBy');

    limit ? urlParams.set('limit', limit.toString()) : urlParams.delete('limit');

    view && valueIsViewParam(view) ? urlParams.set('view', view) : urlParams.delete('view');

    hideCriteria ? urlParams.set('hideCriteria', '1') : urlParams.delete('hideCriteria');

    hideEmptyProjects ? urlParams.set('hideEmptyProjects', '1') : urlParams.delete('hideEmptyProjects');

    return urlParams;
};

export const parseBaseValues = (query: ParsedUrlQuery): BaseQueryState => ({
    starred: Boolean(parseInt(parseQueryParam(query.starred?.toString()).toString(), 10)),
    watching: Boolean(parseInt(parseQueryParam(query.watching?.toString()).toString(), 10)),
    groupBy: parseGroupByParam(query.groupBy?.toString()),
    view: parseViewParam(query.view?.toString()),
    limit: query.limit ? Number(query.limit) : undefined,
});

export const parseFilterValues = (query: ParsedUrlQuery): FilterQueryState => {
    const queryMap = {} as FilterQueryState;

    if (query.priority) queryMap.priority = parseQueryParam(query.priority?.toString());
    if (query.state) queryMap.state = parseQueryParam(query.state?.toString());
    if (query.stateType) {
        queryMap.stateType = parseQueryParam(query.stateType?.toString()).map((type) => StateTypeEnum.parse(type));
    }
    if (query.tag) queryMap.tag = parseQueryParam(query.tag?.toString());
    if (query.estimate) queryMap.estimate = parseQueryParam(query.estimate?.toString());
    if (query.issuer) queryMap.issuer = parseQueryParam(query.issuer?.toString());
    if (query.owner) queryMap.owner = parseQueryParam(query.owner?.toString());
    if (query.participant) queryMap.participant = parseQueryParam(query.participant?.toString());
    if (query.project) queryMap.project = parseQueryParam(query.project?.toString());
    if (query.partnershipProject) queryMap.partnershipProject = parseQueryParam(query.partnershipProject?.toString());
    if (query.query) queryMap.query = parseQueryParam(query.query?.toString()).toString();
    if (query.sort) {
        queryMap.sort = parseSortQueryParam<'goals'>(query.sort?.toString());
    }
    if (query.projectsSort) {
        queryMap.projectsSort = parseSortQueryParam<'projects'>(query.projectsSort?.toString());
    }
    if (query.hideCriteria) queryMap.hideCriteria = Boolean(query.hideCriteria) || undefined;
    if (query.hideEmptyProjects) queryMap.hideEmptyProjects = Boolean(query.hideEmptyProjects) || undefined;

    return queryMap;
};

export const parseQueryState = (query: ParsedUrlQuery) => {
    const queryBaseState = parseBaseValues(query);
    const queryFilterState = parseFilterValues(query);
    const queryState = { ...queryBaseState, ...queryFilterState };

    return {
        queryBaseState,
        queryFilterState,
        queryState,
    };
};

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
