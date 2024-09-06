import React, { FC, MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const KanbanStateColumn: FC<KanbanStateColumnProps> = ({
    state,
    projectId,
    filterPreset,
    partnershipProject,
    onLoadingStateChange,
}) => {
    const { queryState, setTagsFilterOutside } = useUrlFilterParams({
        preset: filterPreset,
    });

    const { data, isFetching, fetchNextPage, hasNextPage, status } =
        trpc.v2.project.getProjectGoalsById.useInfiniteQuery(
            {
                id: projectId,
                goalsQuery: {
                    ...queryState,
                    partnershipProject: partnershipProject || undefined,
                    state: [state.id],
                },
            },
            {
                keepPreviousData: true,
                staleTime: refreshInterval,
                getNextPageParam: ({ pagination }) => pagination.offset,
            },
        );

    const goals = useMemo(() => {
        if (data == null) {
            return [];
        }

        return data.pages.reduce<(typeof data)['pages'][number]['goals']>((acc, cur) => {
            acc.push(...cur.goals);
            return acc;
        }, []);
    }, [data]);

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
        <KanbanColumn>
            <KanbanState className={s.KanbanState} state={state} />

            {goals.map((goal) => {
                return (
                    <NextLink
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
