import { FC, useEffect, ComponentProps, MouseEventHandler, useReducer, useMemo } from 'react';
import { nullable } from '@taskany/bricks';
import { TreeViewElement, Badge, Spinner } from '@taskany/bricks/harmony';

import { FilterById, GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { trpc } from '../../utils/trpcClient';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { refreshInterval } from '../../utils/config';
import { GoalTableList, mapToRenderProps } from '../GoalTableList/GoalTableList';
import { ProjectListItemCollapsable } from '../ProjectListItemCollapsable/ProjectListItemCollapsable';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { Kanban, buildKanban } from '../Kanban/Kanban';
import { LoadMoreButton } from '../LoadMoreButton/LoadMoreButton';
import { NoGoalsText } from '../NoGoalsText/NoGoalsText';
import { safeUserData } from '../../utils/getUserName';

import { tr } from './ProjectListItemConnected.i18n';

interface ProjectListItemConnectedProps extends ComponentProps<typeof ProjectListItemCollapsable> {
    parent?: ComponentProps<typeof ProjectListItemCollapsable>['project'];
    filterPreset?: FilterById;
    onClickProvider?: (g: Partial<GoalByIdReturnType>) => MouseEventHandler<HTMLElement>;
}

const onProjectClickHandler = (e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault();
    } else {
        e.stopPropagation();
    }
};

export const ProjectListItemConnected: FC<ProjectListItemConnectedProps> = ({
    filterPreset,
    parent,
    project,
    ...props
}) => {
    const { queryState, setTagsFilterOutside, view } = useUrlFilterParams({
        preset: filterPreset,
    });
    const { on } = useGoalPreview();
    const utils = trpc.useContext();

    const [isOpen, setIsOpen] = useReducer((isOpen) => !isOpen, !!props.visible);

    const {
        data: projectGoals,
        isLoading: isGoalsLoading,
        isFetching: isGoalsFetch,
        fetchNextPage: fetchNextGoals,
        hasNextPage,
    } = trpc.v2.project.getProjectGoalsById.useInfiniteQuery(
        {
            id: project.id,
            goalsQuery: queryState,
        },
        {
            keepPreviousData: true,
            staleTime: refreshInterval,
            enabled: isOpen,
            getNextPageParam: ({ pagination }) => pagination.offset,
        },
    );

    const { data: childrenProjects = [], isLoading: isChildrenLoading } = trpc.v2.project.getProjectChildren.useQuery(
        {
            id: project.id,
        },
        {
            enabled: isOpen,
        },
    );

    const goals = useMemo(() => {
        if (projectGoals == null) {
            return [];
        }

        return projectGoals.pages.reduce<(typeof projectGoals)['pages'][number]['goals']>((acc, cur) => {
            acc.push(...cur.goals);
            return acc;
        }, []);
    }, [projectGoals]);

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', (updatedId) => {
            const idInList = goals.find(({ _shortId }) => _shortId === updatedId);
            if (idInList?.projectId != null) {
                utils.project.getDeepInfo.invalidate({ id: idInList.projectId });
                utils.project.getByIds.invalidate({ ids: [idInList.projectId] });
            }
        });

        const unsubDelete = on('on:goal:delete', (updatedId) => {
            const idInList = goals.find(({ _shortId }) => _shortId === updatedId);
            if (idInList?.projectId != null) {
                utils.project.getDeepInfo.invalidate({ id: idInList.projectId });
            }
        });

        return () => {
            unsubDelete();
            unsubUpdate();
        };
    }, [on, goals, utils.project.getByIds, utils.project.getDeepInfo]);

    const kanban = useMemo(
        () =>
            buildKanban(goals ?? [], (goal) => ({
                ...goal,
                shortId: goal._shortId,
                id: goal.id,
                commentsCount: goal._count.comments ?? 0,
                progress: goal._achivedCriteriaWeight,
            })),
        [goals],
    );

    const isKanbanView = view === 'kanban';

    const subNodes = useMemo(
        () =>
            childrenProjects.map((p) => (
                <ProjectListItemConnected
                    key={p.id}
                    project={p}
                    parent={project}
                    filterPreset={filterPreset}
                    titleSize={isKanbanView ? 'l' : 'm'}
                    actionButtonView={isKanbanView ? 'default' : 'icons'}
                />
            )),
        [childrenProjects, isKanbanView, filterPreset, project],
    );

    const isLoading = isChildrenLoading && isGoalsLoading;

    return (
        <>
            <ProjectListItemCollapsable
                onClick={onProjectClickHandler}
                project={project}
                parent={isKanbanView ? parent : undefined}
                goals={nullable(
                    !isLoading,
                    () =>
                        nullable(goals, (g) =>
                            isKanbanView ? (
                                <Kanban value={kanban} filterPreset={filterPreset} />
                            ) : (
                                <>
                                    <TreeViewElement>
                                        <GoalTableList
                                            goals={mapToRenderProps(g, (goal) => ({
                                                ...goal,
                                                shortId: goal._shortId,
                                                commentsCount: goal._count.comments,
                                                owner: safeUserData(goal.owner),
                                                participants: goal.participants?.map(safeUserData),
                                                achievedCriteriaWeight: goal._achivedCriteriaWeight,
                                                partnershipProjects: goal.partnershipProjects,
                                                isInPartnerProject: project.id !== goal.projectId,
                                            }))}
                                            onTagClick={setTagsFilterOutside}
                                            onGoalClick={onProjectClickHandler}
                                        />
                                    </TreeViewElement>
                                    {nullable(hasNextPage, () => (
                                        <LoadMoreButton
                                            disabled={isGoalsFetch}
                                            onClick={fetchNextGoals as () => void}
                                        />
                                    ))}
                                </>
                            ),
                        ),
                    <Badge iconLeft={<Spinner size="s" />} text={tr('Loading ...')} />,
                )}
                onShow={setIsOpen}
                onHide={setIsOpen}
                {...props}
            >
                <TreeViewElement>
                    {nullable(!goals.length && (!childrenProjects.length || view === 'kanban') && !isLoading, () => (
                        <NoGoalsText />
                    ))}
                </TreeViewElement>
                {nullable(!isKanbanView, () => subNodes)}
            </ProjectListItemCollapsable>
            {nullable(isKanbanView, () => subNodes)}
        </>
    );
};
