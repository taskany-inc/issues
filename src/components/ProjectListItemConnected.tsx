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
}> = ({ queryState, project, onClickProvider, onTagClick, selectedResolver, deep = 0 }) => {
    const [fetchGoalsEnabled, setFetchGoalsEnabled] = useState(false);

    const { data: projectDeepInfo } = trpc.project.getDeepInfo.useQuery(
        {
            id: project.id,
            ...queryState,
        },
        {
            enabled: fetchGoalsEnabled,
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    const [fetchChildEnabled, setFetchChildEnabled] = useState(false);

    const ids = useMemo(() => project?.children.map(({ id }) => id) || [], [project]);
    const { data: childrenProjects = [], status } = trpc.project.getByIds.useQuery(ids, {
        enabled: fetchChildEnabled,
    });

    const goals = useMemo(
        () => projectDeepInfo?.goals.filter((g) => g.projectId === project.id),
        [projectDeepInfo, project],
    );

    const onCollapsedChange = useCallback((value: boolean) => {
        setFetchChildEnabled(!value);
    }, []);

    const onGoalsCollapsedChange = useCallback((value: boolean) => {
        setFetchGoalsEnabled(!value);
    }, []);

    return (
        <ProjectListItemCollapsable
            href={routes.project(project.id)}
            goals={goals?.map((g) => (
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
            onCollapsedChange={onCollapsedChange}
            onGoalsCollapsedChange={onGoalsCollapsedChange}
            loading={status === 'loading'}
            deep={deep}
        >
            {childrenProjects.map((p) => (
                <ProjectListItemConnected
                    key={p.id}
                    project={p}
                    queryState={queryState}
                    deep={deep + 1}
                    onTagClick={onTagClick}
                    onClickProvider={onClickProvider}
                    selectedResolver={selectedResolver}
                />
            ))}
        </ProjectListItemCollapsable>
    );
};
