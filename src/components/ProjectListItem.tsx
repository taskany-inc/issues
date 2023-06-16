import React, { FC, MouseEvent, MouseEventHandler, ReactNode, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { Badge, Button, EyeIcon, StarFilledIcon, Text, nullable } from '@taskany/bricks';
import { gapS, gray3, gray4, gray6, radiusM } from '@taskany/colors';

import { ActivityByIdReturnType, GoalByIdReturnType, ProjectByIdReturnType } from '../../trpc/inferredTypes';
import { routes } from '../hooks/router';
import { trpc } from '../utils/trpcClient';
import { refreshInterval } from '../utils/config';
import { QueryState } from '../hooks/useUrlFilterParams';

import { Table, TableCell, TableRow } from './Table';
import { UserGroup } from './UserGroup';
import { GoalListItem, GoalsListContainer } from './GoalListItem';
import { Collapsable, CollapsableItem, collapseOffset } from './CollapsableItem';

const ShowGoalsButton = styled(Button)`
    margin-left: ${gapS};
    cursor: pointer;
`;

export const ProjectListContainer: FC<{ children: ReactNode; offset?: number }> = ({ children, offset = 0 }) => (
    <Table columns={5} offset={offset}>
        {children}
    </Table>
);

interface ProjectListItemBaseProps {
    title: string;
    owner?: ActivityByIdReturnType;
    participants?: ActivityByIdReturnType[];
    starred?: boolean;
    watching?: boolean;
}

interface ProjectListItemProps extends ProjectListItemBaseProps {
    href?: string;
    children?: ReactNode;
}

interface ProjectListItemCollapsibleProps extends ProjectListItemBaseProps {
    id: string;
    href: string;
    fetchProjects: (id: string) => Promise<NonNullable<ProjectByIdReturnType>[] | null>;
    onTagClick?: React.ComponentProps<typeof GoalListItem>['onTagClick'];
    onClickProvider?: (g: NonNullable<GoalByIdReturnType>) => MouseEventHandler<HTMLAnchorElement>;
    selectedResolver?: (id: string) => boolean;
    queryState?: QueryState;
    deep?: number;
}

export const ProjectListItem: React.FC<ProjectListItemProps> = ({
    href,
    title,
    owner,
    participants,
    starred,
    watching,
    children,
}) => {
    const row = (
        <TableRow>
            <TableCell>
                <Text size="l" weight="bold">
                    {title}
                </Text>
                {children}
            </TableCell>

            <TableCell>
                {nullable(owner, (o) => (
                    <UserGroup users={[o]} />
                ))}
            </TableCell>

            <TableCell>{nullable(participants, (p) => (p.length ? <UserGroup users={p} /> : null))}</TableCell>

            <TableCell>
                {nullable(starred, () => (
                    <StarFilledIcon size="s" />
                ))}
            </TableCell>

            <TableCell>
                {nullable(watching, () => (
                    <EyeIcon size="s" />
                ))}
            </TableCell>
        </TableRow>
    );

    return href ? (
        <Link href={href} passHref>
            {row}
        </Link>
    ) : (
        row
    );
};

export const ProjectListItemCollapsible: React.FC<ProjectListItemCollapsibleProps> = ({
    id,
    title,
    starred,
    watching,
    owner,
    participants,
    fetchProjects,
    onTagClick,
    onClickProvider,
    selectedResolver,
    queryState,
    deep = 0,
}) => {
    const [collapsed, setIsCollapsed] = useState(true);
    const [collapsedGoals, setIsCollapsedGoals] = useState(true);
    const [projects, setProjects] = useState<undefined | null | NonNullable<ProjectByIdReturnType>[]>(undefined);

    const { data: projectDeepInfo } = trpc.project.getDeepInfo.useQuery(
        {
            id,
            ...queryState,
        },
        {
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    const goals = useMemo(
        () => (projectDeepInfo ? projectDeepInfo.goals.filter((g) => g.projectId === id) : null),
        [projectDeepInfo, id],
    );

    const offset = collapseOffset * (collapsed ? deep - 1 : deep);

    const onClick = useCallback(() => {
        if (typeof projects === 'undefined') {
            fetchProjects(id).then((projects) => {
                setProjects(projects);

                if (projects?.length) {
                    setIsCollapsed(false);
                }
            });
        } else if (projects?.length) {
            setIsCollapsed((value) => !value);
        }
    }, [fetchProjects, projects]);

    const onHeaderButtonClick = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();

            setIsCollapsedGoals((value) => !value);
        },
        [projects, collapsedGoals, onClick, collapsed],
    );

    return (
        <Collapsable
            collapsed={collapsed}
            onClick={projects !== null ? onClick : undefined}
            header={
                <ProjectListContainer offset={offset}>
                    <ProjectListItem
                        title={title}
                        owner={owner}
                        participants={participants}
                        starred={starred}
                        watching={watching}
                    >
                        <ShowGoalsButton
                            onClick={onHeaderButtonClick}
                            disabled={!goals?.length}
                            text={'Goals'}
                            iconRight={<Badge size="s">{goals?.length ?? 0}</Badge>}
                        />
                    </ProjectListItem>
                </ProjectListContainer>
            }
            content={nullable(projects, (projects) =>
                projects.map((p, i) => (
                    <ProjectListItemCollapsible
                        id={p.id}
                        key={`${p.id}_${i}`}
                        href={routes.project(p.id)}
                        title={p.title}
                        owner={p?.activity}
                        participants={p?.participants}
                        starred={p?._isStarred}
                        watching={p?._isWatching}
                        deep={deep + 1}
                        fetchProjects={fetchProjects}
                        onTagClick={onTagClick}
                        onClickProvider={onClickProvider}
                        selectedResolver={selectedResolver}
                        queryState={queryState}
                    />
                )),
            )}
            deep={deep}
        >
            {!collapsedGoals &&
                nullable(goals, (goals) => (
                    <GoalsListContainer offset={offset}>
                        {goals.map((g) => (
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
                                estimate={g.estimate?.length ? g.estimate[g.estimate.length - 1] : undefined}
                                participants={g.participants}
                                starred={g._isStarred}
                                watching={g._isWatching}
                                key={g.id}
                                focused={selectedResolver?.(g.id)}
                                onClick={onClickProvider?.(g)}
                                onTagClick={onTagClick}
                            />
                        ))}
                    </GoalsListContainer>
                ))}
        </Collapsable>
    );
};

export const ProjectItemStandalone: React.FC<ProjectListItemProps> = (props) => (
    <ProjectListContainer>
        <ProjectListItem {...props} />
    </ProjectListContainer>
);
