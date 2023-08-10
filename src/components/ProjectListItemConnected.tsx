import { FC, MouseEventHandler, useState, useMemo, useCallback, ComponentProps } from 'react';

import { GoalByIdReturnType, ProjectByIdReturnType } from '../../trpc/inferredTypes';
import { trpc } from '../utils/trpcClient';
import { QueryState } from '../hooks/useUrlFilterParams';
import { refreshInterval } from '../utils/config';
import { routes } from '../hooks/router';

import { ProjectListItemCollapsable } from './ProjectListItemCollapsable/ProjectListItemCollapsable';
import { GoalListItem } from './GoalListItem';
import { getNodePosition } from './CollapsableItem';

export const ProjectListItemConnected: FC<{
    project: NonNullable<ProjectByIdReturnType>;
    position?: ComponentProps<typeof ProjectListItemCollapsable>['position'];
    queryState: QueryState;
    onTagClick?: React.ComponentProps<typeof GoalListItem>['onTagClick'];
    onClickProvider?: (g: NonNullable<GoalByIdReturnType>) => MouseEventHandler<HTMLAnchorElement>;
    selectedResolver?: (id: string) => boolean;
    deep?: number;
    collapsed?: boolean;
    hasLink?: boolean;
}> = ({
    position = 'root',
    hasLink = false,
    queryState,
    project,
    onClickProvider,
    onTagClick,
    selectedResolver,
    deep = 0,
    collapsed: defaultCollapsed = false,
}) => {
    const [collapsed, setIsCollapsed] = useState(defaultCollapsed);

    const { data: projectDeepInfo } = trpc.project.getDeepInfo.useQuery(
        {
            id: project.id,
            goalsQuery: queryState,
        },
        {
            enabled: !collapsed,
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

    return (
        <ProjectListItemCollapsable
            href={hasLink ? routes.project(project.id) : undefined}
            disabled={!project._count.children && !project._count.goals}
            position={position}
            nodes={childrenProjects.map((p, i) => (
                <ProjectListItemConnected
                    key={p.id}
                    hasLink
                    project={p}
                    position={getNodePosition(i, childrenProjects.length - 1)}
                    queryState={queryState}
                    deep={deep + 1}
                    onTagClick={onTagClick}
                    onClickProvider={onClickProvider}
                    selectedResolver={selectedResolver}
                    collapsed
                />
            ))}
            project={project}
            collapsed={collapsed}
            onClick={onClick}
            loading={status === 'loading'}
            deep={deep}
        >
            {projectDeepInfo?.goals.map((g) => (
                <GoalListItem
                    createdAt={g.createdAt}
                    updatedAt={g.updatedAt}
                    id={g.id}
                    shortId={g._shortId}
                    projectId={g.projectId}
                    state={g.state}
                    title={g.title}
                    issuer={g.activity}
                    owner={g.owner}
                    tags={g.tags}
                    priority={g.priority}
                    comments={g._count?.comments}
                    estimate={g._lastEstimate}
                    participants={g.participants}
                    starred={g._isStarred}
                    watching={g._isWatching}
                    achivedCriteriaWeight={g._achivedCriteriaWeight}
                    key={g.id}
                    focused={selectedResolver?.(g.id)}
                    onClick={onClickProvider?.(g as NonNullable<GoalByIdReturnType>)}
                    onTagClick={onTagClick}
                />
            ))}
        </ProjectListItemCollapsable>
    );
};
