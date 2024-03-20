import React, { ComponentProps, MouseEventHandler, ReactNode } from 'react';
import NextLink from 'next/link';
import { TreeView, TreeViewNode, nullable } from '@taskany/bricks';
import { IconServersOutline } from '@taskany/icons';
import classNames from 'classnames';
import { Link, Text } from '@taskany/bricks/harmony';

import { ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { ProjectListItem } from '../ProjectListItem/ProjectListItem';
import { projectListItem, projectListItemTitle } from '../../utils/domObjects';
import { Title, TableRowItem } from '../Table/Table';

import s from './ProjectListItemCollapsable.module.css';

interface ProjectListItemCollapsableProps extends Omit<ComponentProps<typeof TreeViewNode>, 'title'> {
    href?: string;
    project: Omit<NonNullable<ProjectByIdReturnType>, '_count'>;
    goals?: ReactNode;
    children?: React.ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
    titleSize?: 'm' | 'l';
}

export const ProjectListItemCollapsable: React.FC<ProjectListItemCollapsableProps> = ({
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
                <div className={classNames(s.InlineInfo, s.TitleWrapper)}>
                    <Title size={titleSize} {...projectListItemTitle.attr}>
                        {project.title}
                    </Title>
                    {nullable(project.children.length, (length) => (
                        <div className={s.InlineInfo}>
                            <IconServersOutline size="xs" />
                            <Text size="xs">{length}</Text>
                        </div>
                    ))}
                </div>
            }
            onClick={onClick}
        >
            <ProjectListItem
                owner={project.activity}
                participants={project.participants}
                starred={project._isStarred}
                watching={project._isWatching}
                averageScore={project.averageScore}
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
