import { FC, ComponentProps, useReducer, useMemo, useState, useEffect } from 'react';
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
import { ProjectTree } from '../../../trpc/queries/projectV2';

interface ProjectListItemConnectedProps extends ComponentProps<typeof ProjectListItemCollapsable> {
    parent?: ComponentProps<typeof ProjectListItemCollapsable>['project'];
    subTree?: ProjectTree[string] | null;
    partnershipProject?: string[];
    filterPreset?: FilterById;
    firstLevel?: boolean;
    mainProject?: boolean;
}

const onProjectClickHandler = (e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault();
    } else {
        e.stopPropagation();
    }
};

const getIsProjectEmptySetter = (subTree?: ProjectTree[string] | null) => () => {
    if (subTree) {
        if (Number(subTree.count) > 0) return false;

        const nodes = [subTree.children];
        let i = 0;
        let current = nodes[0];
        while (current) {
            const keys = Object.keys(current);
            for (const key of keys) {
                if (Number(current[key].count) > 0) return false;
                if (current[key].children) {
                    nodes.push(current[key].children);
                }
            }
            i++;
            current = nodes[i];
        }
    }
    return true;
};

export const ProjectListItemConnected: FC<ProjectListItemConnectedProps> = ({
    partnershipProject,
    filterPreset,
    parent,
    project,
    firstLevel,
    subTree,
    mainProject,
    ...props
}) => {
    const { view, hideEmptyProjects } = useUrlFilterParams({
        preset: filterPreset,
    });
    const [isProjectEmpty, setIsProjectEmpty] = useState(getIsProjectEmptySetter(subTree));

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

    const isNeedRender = !(isProjectEmpty && hideEmptyProjects) || mainProject;

    const subNodes = useMemo(
        () =>
            childrenProjects.map((p) => (
                <ProjectListItemConnected
                    subTree={subTree?.children?.[p.id]}
                    key={p.id}
                    project={p}
                    parent={project}
                    filterPreset={filterPreset}
                    partnershipProject={partnershipProject}
                    titleSize={isKanbanView ? 'l' : 'm'}
                    actionButtonView={isKanbanView ? 'default' : 'icons'}
                />
            )),
        [childrenProjects, subTree, project, filterPreset, partnershipProject, isKanbanView],
    );

    const isLoading = isChildrenLoading && !firstLevel;
    const showNoGoals =
        firstLevel || (!isChildrenLoading && (!childrenProjects.length || subTree?.count === undefined));

    useEffect(() => {
        setIsProjectEmpty(getIsProjectEmptySetter(subTree));
    }, [subTree]);

    return nullable(isNeedRender, () => (
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
    ));
};
