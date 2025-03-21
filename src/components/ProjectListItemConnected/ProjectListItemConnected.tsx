import { FC, ComponentProps, useMemo, useState, useEffect } from 'react';
import { nullable } from '@taskany/bricks';
import { TreeViewElement } from '@taskany/bricks/harmony';

import { FilterById, ProjectChildrenTree } from '../../../trpc/inferredTypes';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { routes } from '../../hooks/router';
import { ProjectListItemCollapsable } from '../ProjectListItemCollapsable/ProjectListItemCollapsable';
import { ProjectGoalList } from '../ProjectGoalList/ProjectGoalList';
import { Kanban } from '../Kanban/Kanban';
import { useClientEvent } from '../../hooks/useClientEvent';

interface ProjectListItemConnectedProps extends ComponentProps<typeof ProjectListItemCollapsable> {
    parent?: ComponentProps<typeof ProjectListItemCollapsable>['project'];
    subTree?: ProjectChildrenTree[string] | null;
    partnershipProject?: string[];
    filterPreset?: FilterById;
    mainProject?: boolean;
}

const onProjectClickHandler = (e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault();
    } else {
        e.stopPropagation();
    }
};

const getIsProjectEmptySetter = (subTree?: ProjectChildrenTree[string] | null) => () => {
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
    subTree,
    mainProject,
    ...props
}) => {
    const { view, hideEmptyProjects } = useUrlFilterParams({
        preset: filterPreset,
    });
    const [isProjectEmpty, setIsProjectEmpty] = useState(getIsProjectEmptySetter(subTree));

    const isKanbanView = view === 'kanban';

    const isNeedRender = !(isProjectEmpty && hideEmptyProjects) || mainProject;

    const subNodes = useMemo(
        () =>
            subTree?.children
                ? Object.values(subTree.children).map(({ project: p }) =>
                      nullable(p, (p) => (
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
                  )
                : [],
        [filterPreset, isKanbanView, partnershipProject, project, subTree?.children],
    );

    const showNoGoals = !subNodes.length;

    useEffect(() => {
        setIsProjectEmpty(getIsProjectEmptySetter(subTree));
    }, [subTree]);

    useClientEvent(
        'projectTreeNodeToggle',
        {
            projectId: project.id,
            isOpen: props.visible ?? null,
        },
        isNeedRender,
    );

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
                                askRights={project._onlySubsGoals}
                            />,
                        )}
                    </TreeViewElement>
                }
                {...props}
            >
                {nullable(!isKanbanView, () => subNodes)}
            </ProjectListItemCollapsable>
            {nullable(isKanbanView, () => subNodes)}
        </>
    ));
};
