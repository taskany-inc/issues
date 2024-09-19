import { FC, ComponentProps, useReducer, useMemo } from 'react';
import { nullable } from '@taskany/bricks';
import { TreeViewElement } from '@taskany/bricks/harmony';

import { FilterById } from '../../../trpc/inferredTypes';
import { trpc } from '../../utils/trpcClient';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { routes } from '../../hooks/router';
import { ProjectListItemCollapsable } from '../ProjectListItemCollapsable/ProjectListItemCollapsable';
import { ProjectGoalList } from '../ProjectGoalList/ProjectGoalList';
import { Kanban } from '../Kanban/Kanban';
import { Loader } from '../Loader/Loader';

interface ProjectListItemConnectedProps extends ComponentProps<typeof ProjectListItemCollapsable> {
    parent?: ComponentProps<typeof ProjectListItemCollapsable>['project'];
    partnershipProject?: string[];
    filterPreset?: FilterById;
    firstLevel?: boolean;
}

const onProjectClickHandler = (e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault();
    } else {
        e.stopPropagation();
    }
};

export const ProjectListItemConnected: FC<ProjectListItemConnectedProps> = ({
    partnershipProject,
    filterPreset,
    parent,
    project,
    firstLevel,
    ...props
}) => {
    const { view } = useUrlFilterParams({
        preset: filterPreset,
    });

    const [isOpen, setIsOpen] = useReducer((isOpen) => !isOpen, !!props.visible);

    const { data: childrenProjects = [], isLoading: isChildrenLoading } = trpc.v2.project.getProjectChildren.useQuery(
        {
            id: project.id,
        },
        {
            enabled: isOpen && !firstLevel,
        },
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
                    partnershipProject={partnershipProject}
                    titleSize={isKanbanView ? 'l' : 'm'}
                    actionButtonView={isKanbanView ? 'default' : 'icons'}
                />
            )),
        [childrenProjects, isKanbanView, filterPreset, project, partnershipProject],
    );

    const isLoading = isChildrenLoading && !firstLevel;
    const showNoGoals = firstLevel || (!isChildrenLoading && !childrenProjects.length);

    return (
        <>
            <ProjectListItemCollapsable
                href={routes.project(project.id, view ? `view=${view}` : undefined)}
                onClick={onProjectClickHandler}
                project={project}
                sticky={isKanbanView}
                parent={isKanbanView ? parent : undefined}
                goals={
                    <TreeViewElement>
                        {nullable(
                            !isLoading,
                            () =>
                                nullable(
                                    isKanbanView,
                                    () => (
                                        <Kanban
                                            id={project.id}
                                            filterPreset={filterPreset}
                                            partnershipProject={partnershipProject}
                                        />
                                    ),
                                    <ProjectGoalList
                                        id={project.id}
                                        filterPreset={filterPreset}
                                        partnershipProject={partnershipProject}
                                        showNoGoals={showNoGoals}
                                    />,
                                ),
                            <Loader />,
                        )}
                    </TreeViewElement>
                }
                onShow={setIsOpen}
                onHide={setIsOpen}
                {...props}
            >
                {nullable(!isKanbanView, () => subNodes)}
            </ProjectListItemCollapsable>
            {nullable(isKanbanView, () => subNodes)}
        </>
    );
};
