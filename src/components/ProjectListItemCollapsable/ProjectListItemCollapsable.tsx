import React, { ComponentProps, MouseEventHandler, ReactNode } from 'react';
import NextLink from 'next/link';
import { nullable } from '@taskany/bricks';
import { TreeView, TreeViewNode, Text, Link } from '@taskany/bricks/harmony';
import { IconServersOutline } from '@taskany/icons';

import { DashboardProject } from '../../../trpc/inferredTypes';
import { ProjectListItem } from '../ProjectListItem/ProjectListItem';
import { projectListItem, projectListItemTitle } from '../../utils/domObjects';
import { TableRowItem, TableRowItemTitle } from '../TableRowItem/TableRowItem';

import s from './ProjectListItemCollapsable.module.css';

interface ProjectListItemCollapsableProps extends Omit<ComponentProps<typeof TreeViewNode>, 'title'> {
    href?: string;
    project: NonNullable<DashboardProject>;
    goals?: ReactNode;
    children?: React.ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
    titleSize?: 'm' | 'l';
    editable?: boolean;
}

export const ProjectListItemCollapsable: React.FC<ProjectListItemCollapsableProps> = ({
    editable,
    project,
    children,
    goals,
    href,
    className,
    titleSize = 'l',
    interactive = true,
    onClick,
    ...props
}) => {
    const projectComponent = (
        <TableRowItem
            title={
                <div className={s.ProjectTitleWrapper}>
                    <TableRowItemTitle size={titleSize} {...projectListItemTitle.attr}>
                        {project.title}
                    </TableRowItemTitle>
                    {nullable(project.children.length, (length) => (
                        <div className={s.ProjectIcons}>
                            <IconServersOutline size="xs" />
                            <Text size="xs">{length}</Text>
                        </div>
                    ))}
                </div>
            }
            onClick={onClick}
        >
            <ProjectListItem
                id={project.id}
                stargizers={project.stargizers}
                owner={project.activity}
                participants={project.participants}
                starred={project._isStarred}
                watching={project._isWatching}
                averageScore={project.averageScore}
                editable={editable}
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
