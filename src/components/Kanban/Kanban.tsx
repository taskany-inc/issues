import React, { ComponentProps, FC, MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KanbanColumn, KanbanContainer } from '@taskany/bricks/harmony';
import { QueryStatus } from '@tanstack/react-query';
import { nullable, useIntersectionLoader } from '@taskany/bricks';

import { trpc } from '../../utils/trpcClient';
import { FilterById, State } from '../../../trpc/inferredTypes';
import { refreshInterval } from '../../utils/config';
import { getIsStateShown } from '../../utils/getShownStates';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useGoalPreviewInvalidate } from '../../hooks/useGoalPreviewInvalidate';
import { NextLink } from '../NextLink';
import { State as KanbanState } from '../State';
import { GoalsKanbanCard } from '../GoalsKanbanCard/GoalsKanbanCard';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { routes } from '../../hooks/router';
import { Loader } from '../Loader/Loader';
import { NoGoalsText } from '../NoGoalsText/NoGoalsText';
import { Draggable, DraggableContext } from '../Draggable';

import s from './Kanban.module.css';

type LoadingState = QueryStatus | 'empty';
type onLoadingStateChange = (state: LoadingState) => void;

interface KanbanStateColumnProps {
    state: State;
    projectId: string;
    filterPreset?: FilterById;
    partnershipProject?: string[];
    onLoadingStateChange?: onLoadingStateChange;
}

const calculateCommonLoadingState = (map: Map<unknown, LoadingState>): LoadingState => {
    const loadingStates = new Set(map.values());

    if (loadingStates.size === 1) {
        return loadingStates.values().next().value;
    }

    if (loadingStates.has('loading')) {
        return 'loading';
    }

    if (loadingStates.has('error')) {
        return 'error';
    }

    return 'success';
};

const useOnChangeRef = <T extends string>(value: T, onChange?: (value: T) => void) => {
    const statePrev = useRef<T>();

    useEffect(() => {
        if (value !== statePrev.current) {
            statePrev.current = value;
            onChange?.(value);
        }
    }, [value, onChange]);
};

const intersectionOptions = {
    root: null,
    rootMargin: '0px 0px 300px',
};

const useColumnQuery = ({
    partnershipProject,
    filterPreset,
    id,
}: {
    filterPreset?: FilterById;
    id: string;
    partnershipProject?: string[];
}) => {
    const { queryState } = useUrlFilterParams({
        preset: filterPreset,
    });

    const getColumnQuery = useCallback(
        (stateId: string) => ({
            id,
            goalsQuery: {
                ...queryState,
                partnershipProject: partnershipProject || undefined,
                state: [stateId],
            },
        }),
        [queryState, partnershipProject, id],
    );

    return {
        getColumnQuery,
    };
};

const KanbanStateColumn: FC<KanbanStateColumnProps> = ({
    state,
    projectId,
    filterPreset,
    partnershipProject,
    onLoadingStateChange,
}) => {
    const { setTagsFilterOutside } = useUrlFilterParams({
        preset: filterPreset,
    });

    const { getColumnQuery } = useColumnQuery({
        partnershipProject,
        filterPreset,
        id: projectId,
    });

    const { data, isFetching, fetchNextPage, hasNextPage, status } =
        trpc.v2.project.getProjectGoalsById.useInfiniteQuery(getColumnQuery(state.id), {
            keepPreviousData: true,
            staleTime: refreshInterval,
            getNextPageParam: ({ pagination }) => pagination.offset,
        });

    const goals = useMemo(() => {
        if (data == null) {
            return [];
        }

        return data.pages.reduce<(typeof data)['pages'][number]['goals']>((acc, cur) => {
            acc.push(...cur.goals);
            return acc;
        }, []);
    }, [data]);

    const [list, setList] = useState(goals);

    useEffect(() => {
        setList(goals);
    }, [goals]);

    const loadingState = useMemo(() => {
        if (isFetching) {
            return 'loading';
        }
        return status === 'success' && goals.length === 0 ? 'empty' : status;
    }, [isFetching, goals, status]);

    useGoalPreviewInvalidate(goals);
    useOnChangeRef(loadingState, onLoadingStateChange);

    const { setPreview } = useGoalPreview();

    const onGoalPreviewShow = useCallback(
        (goal: Parameters<typeof setPreview>[1]): MouseEventHandler<HTMLAnchorElement> =>
            (e) => {
                if (e.metaKey || e.ctrlKey || !goal?._shortId) return;

                e.preventDefault();
                setPreview(goal._shortId, goal);
            },
        [setPreview],
    );

    const ref = useIntersectionLoader<HTMLDivElement>(
        () => fetchNextPage(),
        Boolean(!isFetching && hasNextPage),
        intersectionOptions,
    );

    return (
        <KanbanColumn className={s.KanbanColumn}>
            <KanbanState className={s.KanbanState} state={state} />
            <Draggable className={s.KanbanSortableList} id={state.id}>
                {list.map((goal) => {
                    return (
                        <NextLink
                            id={goal.id}
                            key={goal.id}
                            href={routes.goal(goal._shortId)}
                            onClick={onGoalPreviewShow({
                                _shortId: goal._shortId,
                                title: goal.title,
                            })}
                            className={s.KanbanLink}
                        >
                            <GoalsKanbanCard
                                id={goal.id}
                                title={goal.title}
                                commentsCount={goal._count.comments ?? 0}
                                updatedAt={goal.updatedAt}
                                owner={goal.owner}
                                estimate={goal.estimate}
                                estimateType={goal.estimateType}
                                tags={goal.tags}
                                priority={goal.priority}
                                progress={goal._achivedCriteriaWeight}
                                onTagClick={setTagsFilterOutside}
                            />
                        </NextLink>
                    );
                })}
            </Draggable>

            <div ref={ref} />
        </KanbanColumn>
    );
};

interface KanbanProps {
    id: string;
    filterPreset?: FilterById;
    partnershipProject?: string[];
}

export const Kanban = ({ id, filterPreset, partnershipProject }: KanbanProps) => {
    const { queryState } = useUrlFilterParams({
        preset: filterPreset,
    });

    const { data: states = [] } = trpc.state.all.useQuery();

    const shownStates = useMemo(() => {
        return states.filter((state) => getIsStateShown(state, queryState));
    }, [states, queryState]);

    const [loaders, setLoaders] = useState(
        () => new Map<string, LoadingState>(shownStates.map((state) => [state.id, 'loading'])),
    );

    const tableLoadingState = useMemo(() => calculateCommonLoadingState(loaders), [loaders]);

    const { getColumnQuery } = useColumnQuery({
        partnershipProject,
        filterPreset,
        id,
    });

    const stateChangeMutations = trpc.goal.switchState.useMutation();
    const utils = trpc.useContext();

    const onDrop = useCallback<ComponentProps<typeof DraggableContext>['onDrop']>(
        async (el, to, from) => {
            const goalId = el.id;
            const newStateId = to.id;
            const oldStateId = from.id;

            console.log('QQQ DROP', goalId, newStateId, oldStateId);

            const state = newStateId ? shownStates.find(({ id }) => newStateId === id) : null;

            if (!state) {
                return;
            }

            const data = utils.v2.project.getProjectGoalsById.getInfiniteData(getColumnQuery(oldStateId));

            const goals =
                data?.pages?.reduce<(typeof data)['pages'][number]['goals']>((acc, cur) => {
                    acc.push(...cur.goals);
                    return acc;
                }, []) || [];

            const goal = goals.find((goal) => goal.id === goalId);

            await utils.v2.project.getProjectGoalsById.setInfiniteData(getColumnQuery(oldStateId), (data) => {
                if (!data) {
                    return {
                        pages: [],
                        pageParams: [],
                    };
                }

                return {
                    ...data,
                    pages: data.pages.map((page) => ({
                        ...page,
                        goals: page.goals.filter((goal) => goal.id !== goalId),
                    })),
                };
            });

            if (newStateId && goal) {
                await utils.v2.project.getProjectGoalsById.setInfiniteData(getColumnQuery(newStateId), (data) => {
                    if (!data) {
                        return {
                            pages: [],
                            pageParams: [],
                        };
                    }

                    const [first, ...rest] = data.pages;

                    const updatedFirst = {
                        ...first,
                        goals: [goal, ...first.goals],
                    };

                    return {
                        ...data,
                        pages: [updatedFirst, ...rest],
                    };
                });
            }

            await stateChangeMutations.mutate(
                {
                    id: goalId,
                    state,
                },
                {
                    onSettled: () => {
                        utils.v2.project.getProjectGoalsById.invalidate({
                            id,
                        });
                    },
                },
            );
        },
        [stateChangeMutations, utils, getColumnQuery, shownStates, id],
    );

    return (
        <>
            <KanbanContainer>
                <DraggableContext onDrop={onDrop}>
                    {shownStates.map((state) => (
                        <KanbanStateColumn
                            key={state.id}
                            projectId={id}
                            state={state}
                            filterPreset={filterPreset}
                            partnershipProject={partnershipProject}
                            onLoadingStateChange={(loadingState) => {
                                setLoaders((map) => {
                                    map.set(state.id, loadingState);

                                    return new Map(map);
                                });
                            }}
                        />
                    ))}
                </DraggableContext>
            </KanbanContainer>

            {nullable(tableLoadingState === 'loading', () => (
                <Loader />
            ))}
            {nullable(tableLoadingState === 'empty', () => (
                <NoGoalsText />
            ))}
        </>
    );
};
