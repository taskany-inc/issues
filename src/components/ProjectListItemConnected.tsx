import { FC, MouseEventHandler, useState, useMemo, useCallback } from 'react';

import { GoalByIdReturnType, ProjectByIdReturnType } from '../../trpc/inferredTypes';
import { trpc } from '../utils/trpcClient';
import { QueryState } from '../hooks/useUrlFilterParams';
import { refreshInterval } from '../utils/config';
import { routes } from '../hooks/router';

import { ProjectListItemCollapsable } from './ProjectListItemCollapsable/ProjectListItemCollapsable';
import { GoalListItem } from './GoalListItem';

export const ProjectListItemConnected: FC<{
    project: NonNullable<ProjectByIdReturnType>;
    queryState: QueryState;
    onTagClick?: React.ComponentProps<typeof GoalListItem>['onTagClick'];
    onClickProvider?: (g: NonNullable<GoalByIdReturnType>) => MouseEventHandler<HTMLAnchorElement>;
    selectedResolver?: (id: string) => boolean;
    deep?: number;
    collapsed?: boolean;
    collapsedGoals?: boolean;
    hasLink?: boolean;
}> = ({
    hasLink = false,
    queryState,
    project,
    onClickProvider,
    onTagClick,
    selectedResolver,
    deep = 0,
    collapsed: defaultCollapsed = false,
    collapsedGoals: defaultCollapsedGoals = false,
}) => {
    const [collapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [collapsedGoals, setIsCollapsedGoals] = useState(defaultCollapsedGoals);

    const { data: projectDeepInfo } = trpc.project.getDeepInfo.useQuery(
        {
            id: project.id,
            goalsQuery: queryState,
        },
        {
            enabled: !collapsedGoals,
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    const ids = useMemo(() => project?.children.map(({ id }) => id) || [], [project]);
    const { data: childrenProjects = [], status } = trpc.project.getByIds.useQuery(
        { ids, goalsQuery: queryState },
        {
            enabled: !collapsed,
        },
    );

    const onClick = useCallback(() => {
        setIsCollapsed((value) => !value);
    }, []);

    const onGoalsClick = useCallback(() => {
        setIsCollapsedGoals((value) => !value);
    }, []);

    return (
        <ProjectListItemCollapsable
            href={hasLink ? routes.project(project.id) : undefined}
            goals={projectDeepInfo?.goals.map((g) => (
                <GoalListItem
                    createdAt={g.createdAt}
                    updatedAt={g.updatedAt}
                    id={g.id}
                    shortId={g._shortId}
                    projectId={g.projectId}
                    state={g.state!}
                    title={g.title}
                    issuer={g.activity!}
                    owner={g.owner!}
                    tags={g.tags}
                    priority={g.priority!}
                    comments={g._count?.comments}
                    estimate={g._lastEstimate}
                    participants={g.participants}
                    starred={g._isStarred}
                    watching={g._isWatching}
                    key={g.id}
                    focused={selectedResolver?.(g.id)}
                    onClick={onClickProvider?.(g as NonNullable<GoalByIdReturnType>)}
                    onTagClick={onTagClick}
                />
            ))}
            project={project}
            collapsed={collapsed}
            collapsedGoals={collapsedGoals}
            onClick={onClick}
            onGoalsClick={onGoalsClick}
            loading={status === 'loading'}
            deep={deep}
        >
            {childrenProjects.map((p) => (
                <ProjectListItemConnected
                    key={p.id}
                    hasLink={hasLink}
                    project={p}
                    queryState={queryState}
                    deep={deep + 1}
                    onTagClick={onTagClick}
                    onClickProvider={onClickProvider}
                    selectedResolver={selectedResolver}
                    collapsedGoals
                    collapsed
                />
            ))}
        </ProjectListItemCollapsable>
    );
};
