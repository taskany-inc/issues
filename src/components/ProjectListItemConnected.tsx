import { FC, useEffect, ComponentProps, MouseEventHandler, useReducer, useMemo } from 'react';
import { nullable } from '@taskany/bricks';
import { TreeViewElement } from '@taskany/bricks/harmony';

import { FilterById, GoalByIdReturnType } from '../../trpc/inferredTypes';
import { trpc } from '../utils/trpcClient';
import { buildKanban } from '../utils/kanban';
import { useUrlFilterParams } from '../hooks/useUrlFilterParams';
import { refreshInterval } from '../utils/config';
import { routes } from '../hooks/router';

import { GoalTableList } from './GoalTableList/GoalTableList';
import { ProjectListItemCollapsable } from './ProjectListItemCollapsable/ProjectListItemCollapsable';
import { InlineCreateGoalControl } from './InlineCreateGoalControl/InlineCreateGoalControl';
import { useGoalPreview } from './GoalPreview/GoalPreviewProvider';
import { Kanban } from './Kanban/Kanban';

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

    const [isOpen, setIsOpen] = useReducer((isOpen) => !isOpen, false);

    const { data: projectDeepInfo } = trpc.project.getDeepInfo.useQuery(
        {
            id: project.id,
            goalsQuery: queryState,
        },
        {
            keepPreviousData: true,
            staleTime: refreshInterval,
            enabled: isOpen,
        },
    );

    const { data: childrenProjects = [], isLoading } = trpc.v2.project.getProjectChildren.useQuery(
        {
            id: project.id,
        },
        {
            enabled: isOpen,
        },
    );

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', (updatedId) => {
            const idInList = projectDeepInfo?.goals.find(({ _shortId }) => _shortId === updatedId);
            if (idInList?.projectId != null) {
                utils.project.getDeepInfo.invalidate({ id: idInList.projectId });
                utils.project.getByIds.invalidate({ ids: [idInList.projectId] });
            }
        });

        const unsubDelete = on('on:goal:delete', (updatedId) => {
            const idInList = projectDeepInfo?.goals.find(({ _shortId }) => _shortId === updatedId);
            if (idInList?.projectId != null) {
                utils.project.getDeepInfo.invalidate({ id: idInList.projectId });
            }
        });

        return () => {
            unsubDelete();
            unsubUpdate();
        };
    }, [on, projectDeepInfo?.goals, utils.project.getByIds, utils.project.getDeepInfo]);

    const kanban = useMemo(() => buildKanban(projectDeepInfo?.goals || []), [projectDeepInfo]);

    const subNodes = useMemo(
        () =>
            childrenProjects.map((p) => (
                <ProjectListItemConnected
                    key={p.id}
                    project={p}
                    parent={project}
                    filterPreset={filterPreset}
                    titleSize={view === 'kanban' ? 'l' : 'm'}
                />
            )),
        [childrenProjects, view, filterPreset, project],
    );

    return (
        <>
            <ProjectListItemCollapsable
                href={routes.project(project.id, view ? `view=${view}` : undefined)}
                onClick={onProjectClickHandler}
                project={project}
                parent={view === 'kanban' ? parent : undefined}
                goals={nullable(projectDeepInfo?.goals, (goals) =>
                    view === 'kanban' ? (
                        <Kanban value={kanban} filterPreset={filterPreset} />
                    ) : (
                        <TreeViewElement>
                            <GoalTableList
                                goals={goals}
                                onTagClick={setTagsFilterOutside}
                                onGoalClick={onProjectClickHandler}
                            />
                        </TreeViewElement>
                    ),
                )}
                onShow={setIsOpen}
                onHide={setIsOpen}
                {...props}
            >
                <TreeViewElement>
                    {nullable(
                        !projectDeepInfo?.goals.length,
                        () => !isLoading && <InlineCreateGoalControl project={project} />,
                    )}
                </TreeViewElement>
                {nullable(view !== 'kanban', () => subNodes)}
            </ProjectListItemCollapsable>
            {nullable(view === 'kanban', () => subNodes)}
        </>
    );
};
