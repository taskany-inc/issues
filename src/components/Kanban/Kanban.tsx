import React, { ComponentProps, FC, MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KanbanColumn, KanbanContainer } from '@taskany/bricks/harmony';
import { QueryStatus } from '@tanstack/react-query';
import { nullable, useIntersectionLoader } from '@taskany/bricks';
import { ReactSortable } from 'react-sortablejs';
import cn from 'classnames';

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

import s from './Kanban.module.css';

type LoadingState = QueryStatus | 'empty';
type onLoadingStateChange = (state: LoadingState) => void;

interface KanbanStateColumnProps {
    state: State;
    shownStates: State[];
    projectId: string;
    filterPreset?: FilterById;
    partnershipProject?: string[];
    onLoadingStateChange?: onLoadingStateChange;
}

const calculateCommonLoadingState = (map: Map<unknown, LoadingState>): LoadingState => {
    const loadingStates = new Set(map.values());

    if (loadingStates.size === 1) {
        return loadingStates.values().next().value || 'success';
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

const onSortableMove: ComponentProps<typeof ReactSortable>['onMove'] = (event) => {
    if (event.dragged.classList.contains(s.KanbanSortableListItem_disable)) {
        return false;
    }
    return -1;
};

const KanbanStateColumn: FC<KanbanStateColumnProps> = ({
    state,
    shownStates,
    projectId,
    filterPreset,
    partnershipProject,
    onLoadingStateChange,
}) => {
    const { queryState, setTagsFilterOutside } = useUrlFilterParams({
        preset: filterPreset,
    });

    const getColumnQuery = useCallback(
        (stateId: string) => ({
            id: projectId,
            goalsQuery: {
                ...queryState,
                sort: [{ key: 'rank', dir: 'asc' } as const],
                partnershipProject: partnershipProject || undefined,
                state: [stateId],
            },
        }),
        [queryState, partnershipProject, projectId],
    );

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

    const stateChangeMutations = trpc.goal.switchState.useMutation();
    const updateGoalRankMutation = trpc.v2.goal.updateRank.useMutation();
    const utils = trpc.useContext();

    const onDragEnd = useCallback<NonNullable<ComponentProps<typeof ReactSortable>['onEnd']>>(
        async (result) => {
            const {
                item: { id: goalId },
                to: { id: newStateId },
                from: { id: oldStateId },
                oldIndex,
                newIndex,
            } = result;

            if (oldIndex === undefined || newIndex === undefined) {
                return;
            }

            const newState = newStateId ? shownStates.find(({ id }) => newStateId === id) : null;

            const oldStateData = utils.v2.project.getProjectGoalsById.getInfiniteData(getColumnQuery(oldStateId));

            const oldStateGoals =
                oldStateData?.pages?.reduce<(typeof oldStateData)['pages'][number]['goals']>((acc, cur) => {
                    acc.push(...cur.goals);
                    return acc;
                }, []) || [];

            const goal = oldStateGoals.find((goal) => goal.id === goalId);

            if (!goal) {
                return;
            }

            const sameColumnReorder = goal !== undefined && newStateId === oldStateId && oldIndex !== newIndex;

            if (sameColumnReorder) {
                const lowGoal = newIndex < oldIndex ? oldStateGoals[newIndex - 1] : oldStateGoals[newIndex];
                const highGoal = newIndex < oldIndex ? oldStateGoals[newIndex] : oldStateGoals[newIndex + 1];

                await updateGoalRankMutation.mutateAsync({
                    id: goal.id,
                    low: lowGoal?.id,
                    high: highGoal?.id,
                    global: false,
                });

                utils.v2.project.getProjectGoalsById.invalidate({
                    id: projectId,
                });

                return;
            }

            if (!newState) {
                return;
            }

            const newStateData = utils.v2.project.getProjectGoalsById.getInfiniteData(getColumnQuery(newStateId));

            const newStateGoals =
                newStateData?.pages?.reduce<(typeof newStateData)['pages'][number]['goals']>((acc, cur) => {
                    acc.push(...cur.goals);
                    return acc;
                }, []) || [];

            const lowGoal = newStateGoals[newIndex - 1];
            const highGoal = newStateGoals[newIndex];

            await updateGoalRankMutation.mutateAsync({
                id: goal.id,
                low: lowGoal?.id,
                high: highGoal?.id,
                global: false,
            });

            utils.v2.project.getProjectGoalsById.setInfiniteData(getColumnQuery(oldStateId), (data) => {
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

            stateChangeMutations.mutate(
                {
                    id: goalId,
                    state: newState,
                },
                {
                    onSettled: () => {
                        utils.v2.project.getProjectGoalsById.invalidate({
                            id: projectId,
                        });
                    },
                },
            );
        },
        [stateChangeMutations, updateGoalRankMutation, utils, getColumnQuery, shownStates, projectId],
    );

    return (
        <KanbanColumn className={s.KanbanColumn}>
            <KanbanState className={s.KanbanState} state={state} />
            <ReactSortable
                className={s.KanbanSortableList}
                id={state.id}
                animation={150}
                list={list}
                setList={setList}
                ghostClass={s.KanbanSortableListItem_ghost}
                filter={`.${s.KanbanLink}.${s.KanbanSortableListItem_disable}`}
                group="states"
                onEnd={onDragEnd}
                onMove={onSortableMove}
            >
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
                            className={cn(s.KanbanLink, {
                                [s.KanbanSortableListItem_disable]: !goal._isEditable,
                            })}
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
            </ReactSortable>

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

    return (
        <>
            <KanbanContainer>
                {shownStates.map((state) => (
                    <KanbanStateColumn
                        shownStates={shownStates}
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
