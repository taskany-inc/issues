import React, { ComponentProps, MouseEventHandler, ReactNode } from 'react';
import { nullable } from '@taskany/bricks';
import cn from 'classnames';
import { TreeView, TreeViewNode, TreeViewTitle, Text } from '@taskany/bricks/harmony';
import { IconServersOutline } from '@taskany/icons';

import { DashboardProjectV2 } from '../../../trpc/inferredTypes';
import { ProjectListItem } from '../ProjectListItem/ProjectListItem';
import { projectListItem, projectListItemTitle } from '../../utils/domObjects';
import { TableRowItem, TableRowItemTitle } from '../TableRowItem/TableRowItem';

import s from './ProjectListItemCollapsable.module.css';

export type Project = NonNullable<Omit<DashboardProjectV2, 'children' | 'goals' | '_partnerProjectIds'>>;

interface ProjectListItemCollapsableProps extends Omit<ComponentProps<typeof TreeViewNode>, 'title'> {
    href?: string;
    project: Project;
    parent?: Project;
    goals?: ReactNode;
    children?: React.ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
    titleSize?: 'm' | 'l';
    actionButtonView?: 'default' | 'icons';
    sticky?: boolean;
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
    sticky,
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
                    {nullable(project._count?.children, (count) => (
                        <div className={s.ProjectIcons}>
                            <IconServersOutline size="xs" />
                            <Text size="xs">{count}</Text>
                        </div>
                    ))}
                </div>
            }
            onClick={onClick}
            className={s.ProjectListItemCollapsableRow}
        >
            <ProjectListItem
                id={project.id}
                href={href}
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
                title={
                    <TreeViewTitle className={cn({ [s.ProjectListItemCollapsableHeader_sticky]: sticky })}>
                        {projectComponent}
                    </TreeViewTitle>
                }
                {...props}
            >
                {goals}
                {children}
            </TreeViewNode>
        </TreeView>
    );
};
