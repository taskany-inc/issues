import React, { ComponentProps, MouseEventHandler, ReactNode } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { gapS, gapXs } from '@taskany/colors';
import { Text, TreeView, TreeViewNode, nullable } from '@taskany/bricks';
import { IconServersOutline } from '@taskany/icons';

import { ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { ProjectListItem } from '../ProjectListItem';
import { WrappedRowLink } from '../WrappedRowLink';
import { projectListItem, projectListItemTitle } from '../../utils/domObjects';
import { TableRowItem, Title } from '../Table';

const StyledProjectIcons = styled.div`
    display: flex;
    align-items: center;
    gap: ${gapXs};
`;

const StyledTitleWrapper = styled(StyledProjectIcons)`
    justify-content: space-between;
    margin-right: ${gapS};
`;

const StyledTreeViewNode = styled(TreeViewNode)`
    width: fit-content;
`;

interface ProjectListItemCollapsableProps extends Omit<ComponentProps<typeof TreeViewNode>, 'title'> {
    href?: string;
    project: Omit<NonNullable<ProjectByIdReturnType>, '_count'>;
    goals?: ReactNode;
    children?: React.ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
}

export const ProjectListItemCollapsable: React.FC<ProjectListItemCollapsableProps> = ({
    project,
    children,
    goals,
    href,
    className,
    interactive = true,
    onClick,
    ...props
}) => {
    const projectComponent = (
        <TableRowItem
            title={
                <StyledTitleWrapper>
                    <Title size="l" {...projectListItemTitle.attr}>
                        {project.title}
                    </Title>
                    {nullable(project.children.length, (length) => (
                        <StyledProjectIcons>
                            <IconServersOutline size="xs" />
                            <Text size="xs">{length}</Text>
                        </StyledProjectIcons>
                    ))}
                </StyledTitleWrapper>
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
            <StyledTreeViewNode
                interactive={interactive}
                title={nullable(
                    href,
                    (h) => (
                        <NextLink href={h} passHref legacyBehavior>
                            <WrappedRowLink>{projectComponent}</WrappedRowLink>
                        </NextLink>
                    ),
                    projectComponent,
                )}
                {...props}
            >
                {goals}
                {children}
            </StyledTreeViewNode>
        </TreeView>
    );
};
