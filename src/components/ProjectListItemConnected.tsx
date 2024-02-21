import { FC, useMemo, useEffect, ComponentProps, MouseEventHandler } from 'react';
import { nullable } from '@taskany/bricks';
import { TreeViewElement } from '@taskany/bricks/harmony';

import { GoalByIdReturnType } from '../../trpc/inferredTypes';
import { trpc } from '../utils/trpcClient';
import { QueryState } from '../hooks/useUrlFilterParams';
import { refreshInterval } from '../utils/config';
import { routes } from '../hooks/router';

import { GoalTableList } from './GoalTableList/GoalTableList';
import { ProjectListItemCollapsable } from './ProjectListItemCollapsable/ProjectListItemCollapsable';
import { InlineCreateGoalControl } from './InlineCreateGoalControl/InlineCreateGoalControl';
import { useGoalPreview } from './GoalPreview/GoalPreviewProvider';

interface ProjectListItemConnectedProps extends ComponentProps<typeof ProjectListItemCollapsable> {
    queryState?: Partial<QueryState>;
    onClickProvider?: (g: Partial<GoalByIdReturnType>) => MouseEventHandler<HTMLElement>;
    selectedResolver?: (id: string) => boolean;
    onTagClick?: ComponentProps<typeof GoalTableList>['onTagClick'];
}

const onProjectClickHandler = (e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault();
    } else {
        e.stopPropagation();
    }
};

export const ProjectListItemConnected: FC<ProjectListItemConnectedProps> = ({
    queryState,
    project,
    onClickProvider,
    selectedResolver,
    onTagClick,
    ...props
}) => {
    const { on } = useGoalPreview();
    const utils = trpc.useContext();

    const { data: projectDeepInfo } = trpc.project.getDeepInfo.useQuery(
        {
            id: project.id,
            goalsQuery: queryState,
        },
        {
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    const ids = useMemo(() => project?.children.map(({ id }) => id) || [], [project]);
    const { data: childrenProjects = [], isLoading } = trpc.project.getByIds.useQuery({ ids, goalsQuery: queryState });

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', (updatedId) => {
            const idInList = projectDeepInfo?.goals.find(({ _shortId }) => _shortId === updatedId);
            if (idInList) {
                utils.project.getDeepInfo.invalidate();
                utils.project.getByIds.invalidate();
            }
        });

        const unsubDelete = on('on:goal:delete', (updatedId) => {
            const idInList = projectDeepInfo?.goals.find(({ _shortId }) => _shortId === updatedId);
            if (idInList) {
                utils.project.getDeepInfo.invalidate();
            }
        });

        return () => {
            unsubDelete();
            unsubUpdate();
        };
    }, [on, projectDeepInfo?.goals, utils.project.getByIds, utils.project.getDeepInfo]);

    return (
        <ProjectListItemCollapsable
            href={routes.project(project.id)}
            onClick={onProjectClickHandler}
            project={project}
            goals={nullable(projectDeepInfo?.goals, (goals) => (
                <TreeViewElement>
                    <GoalTableList
                        goals={goals}
                        onTagClick={onTagClick}
                        selectedGoalResolver={selectedResolver}
                        onGoalPreviewShow={(goal) => (e) => {
                            onClickProvider?.(goal)(e);
                            onProjectClickHandler(e);
                        }}
                    />
                </TreeViewElement>
            ))}
            {...props}
        >
            <TreeViewElement>
                {nullable(
                    !projectDeepInfo?.goals.length,
                    () => !isLoading && <InlineCreateGoalControl project={project} />,
                )}
            </TreeViewElement>
            {childrenProjects.map((p) => (
                <ProjectListItemConnected
                    key={p.id}
                    project={p}
                    queryState={queryState}
                    onClickProvider={onClickProvider}
                    selectedResolver={selectedResolver}
                    titleSize="m"
                />
            ))}
        </ProjectListItemCollapsable>
    );
};
