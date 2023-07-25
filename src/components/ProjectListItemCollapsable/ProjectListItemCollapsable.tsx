import React, { MouseEvent, ReactNode, useCallback, useMemo } from 'react';
import NextLink from 'next/link';
import styled from 'styled-components';
import { Badge, Button, ExternalLinkIcon, Link, Text, nullable } from '@taskany/bricks';
import { gapS, gray7, gray4, radiusM } from '@taskany/colors';

import { ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { GoalsListContainer } from '../GoalListItem';
import { CollapsableItem, collapseOffset } from '../CollapsableItem';
import { ProjectListContainer, ProjectListItem } from '../ProjectListItem';

import { tr } from './ProjectListItemCollapsable.i18n';

const StyledNoGoals = styled(Text)`
    white-space: nowrap;
`;

const StyledProjectListItemActionsContainer = styled.div`
    display: flex;
    align-items: center;
`;

const StyledProjectListItemAction = styled.div<{ forceVisibility?: boolean }>`
    visibility: ${({ forceVisibility }) => (forceVisibility ? 'visible' : 'hidden')};

    margin-left: ${gapS};

    &:first-child {
        margin-left: 0;
    }
`;

const StyledProjectListItem = styled(ProjectListItem)`
    &:hover {
        ${StyledProjectListItemAction} {
            visibility: visible;
        }
    }
`;

const StyledGoalsListContainer = styled(GoalsListContainer)`
    background-color: ${gray4};
    border-radius: ${radiusM};
    margin: 0px;
    padding: 0px;
`;
interface ProjectListItemCollapsableProps {
    href?: string;
    project: NonNullable<ProjectByIdReturnType>;
    goals?: ReactNode;
    children?: ReactNode;
    collapsed: boolean;
    collapsedGoals: boolean;
    onClick?: () => void;
    onGoalsClick?: () => void;
    loading?: boolean;
    deep?: number;
}

export const ProjectListItemCollapsable: React.FC<ProjectListItemCollapsableProps> = ({
    project,
    collapsed = true,
    collapsedGoals = true,
    onClick,
    onGoalsClick,
    children,
    goals,
    loading = false,
    deep = 0,
    href,
}) => {
    const childs = useMemo(() => project.children.map(({ id }) => id), [project]);

    const onClickEnabled = childs.length;
    const contentHidden = !childs.length || collapsed || loading;

    const offset = collapseOffset * (deep > 0 && contentHidden ? deep - 1 : deep);

    const onGoalsButtonClick = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();

            onGoalsClick?.();
        },
        [onGoalsClick],
    );

    const onExternalLinkClick = useCallback((e: MouseEvent) => {
        e.stopPropagation();
    }, []);

    return (
        <CollapsableItem
            collapsed={contentHidden}
            onClick={onClickEnabled ? onClick : undefined}
            header={
                <ProjectListContainer offset={offset}>
                    <StyledProjectListItem
                        title={project.title}
                        owner={project.activity}
                        participants={project.participants}
                        starred={project._isStarred}
                        watching={project._isWatching}
                        disabled={!onClickEnabled}
                        averageScore={project.averageScore}
                    >
                        <StyledProjectListItemActionsContainer>
                            <StyledProjectListItemAction forceVisibility={!collapsedGoals}>
                                {project._count.goals ? (
                                    <Button
                                        ghost={collapsedGoals}
                                        onClick={onGoalsButtonClick}
                                        text={tr('Goals')}
                                        iconRight={<Badge size="s">{project._count.goals}</Badge>}
                                    />
                                ) : (
                                    <StyledNoGoals color={gray7}>{tr('No goals')}</StyledNoGoals>
                                )}
                            </StyledProjectListItemAction>
                            <StyledProjectListItemAction>
                                {nullable(href, (h) => (
                                    <NextLink href={h} passHref legacyBehavior>
                                        <Link inline target="_blank" onClick={onExternalLinkClick}>
                                            <ExternalLinkIcon size="s" />
                                        </Link>
                                    </NextLink>
                                ))}
                            </StyledProjectListItemAction>
                        </StyledProjectListItemActionsContainer>
                    </StyledProjectListItem>
                </ProjectListContainer>
            }
            content={children}
            deep={deep}
        >
            {!collapsedGoals && <StyledGoalsListContainer offset={offset}>{goals}</StyledGoalsListContainer>}
        </CollapsableItem>
    );
};
