import { FC, useMemo, useEffect, ComponentProps, MouseEventHandler } from 'react';
import { Link, TreeViewElement, nullable } from '@taskany/bricks';

import { GoalByIdReturnType } from '../../trpc/inferredTypes';
import { trpc } from '../utils/trpcClient';
import { QueryState } from '../hooks/useUrlFilterParams';
import { refreshInterval } from '../utils/config';
import { routes } from '../hooks/router';

import { ProjectListItemCollapsable } from './ProjectListItemCollapsable/ProjectListItemCollapsable';
import { GoalListItem } from './GoalListItem';
import { InlineCreateGoalControl } from './InlineCreateGoalControl/InlineCreateGoalControl';
import { useGoalPreview } from './GoalPreview/GoalPreviewProvider';
import { TableRowItem, Title } from './Table';
import { NextLink } from './NextLink';

interface ProjectListItemConnectedProps extends ComponentProps<typeof ProjectListItemCollapsable> {
    queryState?: Partial<QueryState>;
    onTagClick?: React.ComponentProps<typeof GoalListItem>['onTagClick'];
    onClickProvider?: (g: NonNullable<GoalByIdReturnType>) => MouseEventHandler<HTMLElement>;
    selectedResolver?: (id: string) => boolean;
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
    onTagClick,
    selectedResolver,
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
            goals={projectDeepInfo?.goals.map((g) => (
                <TreeViewElement key={g.id}>
                    <Link as={NextLink} href={routes.goal(g._shortId)} inline>
                        <TableRowItem
                            title={<Title size="m">{g.title}</Title>}
                            focused={selectedResolver?.(g.id)}
                            onClick={(e) => {
                                onClickProvider?.(g as NonNullable<GoalByIdReturnType>)(e);
                                onProjectClickHandler(e);
                            }}
                        >
                            <GoalListItem
                                updatedAt={g.updatedAt}
                                state={g.state}
                                issuer={g.activity}
                                owner={g.owner}
                                tags={g.tags}
                                priority={g.priority}
                                comments={g._count?.comments}
                                estimate={g.estimate}
                                estimateType={g.estimateType}
                                participants={g.participants}
                                starred={g._isStarred}
                                watching={g._isWatching}
                                achivedCriteriaWeight={g._achivedCriteriaWeight}
                                onTagClick={onTagClick}
                            />
                        </TableRowItem>
                    </Link>
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
                    onTagClick={onTagClick}
                    onClickProvider={onClickProvider}
                    selectedResolver={selectedResolver}
                />
            ))}
        </ProjectListItemCollapsable>
    );
};
