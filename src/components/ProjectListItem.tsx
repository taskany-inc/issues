import React, { FC, MouseEventHandler, ReactNode, useCallback, useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { EyeIcon, StarFilledIcon, Text, nullable } from '@taskany/bricks';
import { gray6, radiusM } from '@taskany/colors';

import { ActivityByIdReturnType, GoalByIdReturnType, ProjectByIdReturnType } from '../../trpc/inferredTypes';
import { routes } from '../hooks/router';

import { Table, TableCell, TableRow } from './Table';
import { UserGroup } from './UserGroup';
import { GoalListItem, GoalsListContainer } from './GoalListItem';
import { TableRowCollapse, TableRowCollapseContent, collapseOffset } from './CollapsableItem';

const ProjectTableRowCollapseContent = styled(TableRowCollapseContent)`
    // background: ${gray6};
    // border-radius: ${radiusM};

    // ${TableRow}:hover ${TableCell} {
    //     background: ${gray6};
    // }
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
}

interface ProjectListItemCollapsibleProps extends ProjectListItemBaseProps {
    id: string;
    href: string;
    fetchGoals: (id: string) => Promise<NonNullable<GoalByIdReturnType>[] | null>;
    fetchProjects: (id: string) => Promise<NonNullable<ProjectByIdReturnType>[] | null>;
    onTagClick?: React.ComponentProps<typeof GoalListItem>['onTagClick'];
    onClickProvider?: (g: NonNullable<GoalByIdReturnType>) => MouseEventHandler<HTMLAnchorElement>;
    selectedResolver?: (id: string) => boolean;
    deep?: number;
}

export const ProjectListItem: React.FC<ProjectListItemProps> = ({
    href,
    title,
    owner,
    participants,
    starred,
    watching,
}) => {
    const row = (
        <TableRow>
            <TableCell>
                <Text size="l" weight="bold">
                    {title}
                </Text>
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
    fetchGoals,
    fetchProjects,
    onTagClick,
    onClickProvider,
    selectedResolver,
    deep = 0,
}) => {
    const [collapsed, setIsCollapsed] = useState(true);
    const [goals, setGoals] = useState<undefined | null | NonNullable<GoalByIdReturnType>[]>(undefined);
    const [projects, setProjects] = useState<undefined | null | NonNullable<ProjectByIdReturnType>[]>(undefined);

    const offset = collapseOffset * (collapsed ? deep - 1 : deep);

    const onClick = useCallback(() => {
        if (typeof goals === 'undefined' || typeof projects === 'undefined') {
            Promise.all([fetchGoals(id), fetchProjects(id)]).then(([goals, projects]) => {
                setGoals(goals);
                setProjects(projects);

                if (projects?.length || goals?.length) {
                    setIsCollapsed(false);
                }
            });
        } else if (projects?.length || goals?.length) {
            setIsCollapsed((value) => !value);
        }
    }, [fetchGoals, goals, projects]);

    return (
        <TableRowCollapse
            collapsed={collapsed}
            onClick={onClick}
            showLine={Boolean(projects?.length)}
            header={
                <ProjectListContainer offset={offset}>
                    <ProjectListItem
                        title={title}
                        owner={owner}
                        participants={participants}
                        starred={starred}
                        watching={watching}
                    />
                </ProjectListContainer>
            }
            deep={deep}
        >
            {nullable(goals, (goals) => (
                <ProjectTableRowCollapseContent>
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
                </ProjectTableRowCollapseContent>
            ))}

            {nullable(projects, (projects) =>
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
                        fetchGoals={fetchGoals}
                        fetchProjects={fetchProjects}
                        onTagClick={onTagClick}
                        onClickProvider={onClickProvider}
                        selectedResolver={selectedResolver}
                    />
                )),
            )}
        </TableRowCollapse>
    );
};

export const ProjectItemStandalone: React.FC<ProjectListItemProps> = (props) => (
    <ProjectListContainer>
        <ProjectListItem {...props} />
    </ProjectListContainer>
);
