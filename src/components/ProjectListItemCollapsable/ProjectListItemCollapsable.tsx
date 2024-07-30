import React, { ComponentProps, MouseEventHandler, ReactNode } from 'react';
import NextLink from 'next/link';
import { nullable } from '@taskany/bricks';
import { TreeView, TreeViewNode, Text, Link } from '@taskany/bricks/harmony';
import { IconServersOutline } from '@taskany/icons';

import { DashboardProjectV2 } from '../../../trpc/inferredTypes';
import { ProjectListItem } from '../ProjectListItem/ProjectListItem';
import { projectListItem, projectListItemTitle } from '../../utils/domObjects';
import { TableRowItem, TableRowItemTitle } from '../TableRowItem/TableRowItem';

import s from './ProjectListItemCollapsable.module.css';

interface ProjectListItemCollapsableProps extends Omit<ComponentProps<typeof TreeViewNode>, 'title'> {
    href?: string;
    project: NonNullable<DashboardProjectV2>;
    parent?: NonNullable<DashboardProjectV2>;
    goals?: ReactNode;
    children?: React.ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
    titleSize?: 'm' | 'l';
    actionButtonView?: 'default' | 'icons';
}

export const ProjectListItemCollapsable: React.FC<ProjectListItemCollapsableProps> = ({
    project,
    parent,
    children,
    goals,
    href,
    className,
    titleSize = 'l',
    interactive = true,
    actionButtonView,
    onClick,
    ...props
}) => {
    const projectComponent = (
        <TableRowItem
            title={
                <div className={s.ProjectTitleWrapper}>
                    <TableRowItemTitle size={titleSize} {...projectListItemTitle.attr}>
                        {nullable(parent, (p) => (
                            <Text as="span" className={s.ProjectSubTitle}>{`${p.title} / `}</Text>
                        ))}
                        {project.title}
                    </TableRowItemTitle>
                    {nullable(project._count.children, (count) => (
                        <div className={s.ProjectIcons}>
                            <IconServersOutline size="xs" />
                            <Text size="xs">{count}</Text>
                        </div>
                    ))}
                </div>
            }
            onClick={onClick}
        >
            <ProjectListItem
                id={project.id}
                flowId={project.flowId}
                title={project.title}
                stargizers={project._count.stargizers}
                owner={project.activity}
                participants={project.participants}
                starred={project._isStarred}
                watching={project._isWatching}
                averageScore={project.averageScore}
                actionButtonView={actionButtonView}
            />
        </TableRowItem>
    );

    return (
        <TreeView className={className} {...projectListItem.attr}>
            <TreeViewNode
                interactive={interactive}
                title={nullable(
                    href,
                    (h) => (
                        <NextLink href={h} passHref legacyBehavior>
                            <Link>{projectComponent}</Link>
                        </NextLink>
                    ),
                    projectComponent,
                )}
                {...props}
            >
                {goals}
                {children}
            </TreeViewNode>
        </TreeView>
    );
};
