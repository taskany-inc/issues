import React, { MouseEvent, ReactNode, useCallback, useMemo } from 'react';
import NextLink from 'next/link';
import styled, { css } from 'styled-components';
import { Badge, Button, ExternalLinkIcon, Text } from '@taskany/bricks';
import { gapM, gapS, gray7 } from '@taskany/colors';

import { ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { GoalsListContainer } from '../GoalListItem';
import { CollapsableItem, collapseOffset } from '../CollapsableItem';
import { ProjectListContainer, ProjectListItem } from '../ProjectListItem';

import { tr } from './ProjectListItemCollapsable.i18n';

const StyledGoalsButtonContainer = styled.div`
    margin-left: ${gapM};
`;

const hiddenStyles = css`
    visibility: hidden;
    opacity: 0;
    will-change: opacity;
    transition: opacity 0.3s ease-in;
`;

const visibleStyles = css`
    visibility: visible;
    opacity: 0.8;

    &:hover {
        opacity: 1;
    }
`;

const StyledHeaderButton = styled(Button)<{ visibility?: 'visible' | 'hidden' }>`
    ${({ visibility = 'hidden' }) => (visibility === 'visible' ? visibleStyles : hiddenStyles)}
`;

const StyledOpenButton = styled(ExternalLinkIcon)`
    margin-left: ${gapS};
    ${hiddenStyles}
`;

const StyledLink = styled.a`
    color: inherit;
`;

const StyledProjectListItem = styled(ProjectListItem)`
    &:hover ${StyledOpenButton} {
        ${visibleStyles}
    }

    &:hover ${StyledHeaderButton} {
        ${visibleStyles}
    }
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
                    >
                        <StyledGoalsButtonContainer>
                            {project._count.goals ? (
                                <StyledHeaderButton
                                    visibility={collapsedGoals ? 'hidden' : 'visible'}
                                    ghost={collapsedGoals}
                                    onClick={onGoalsButtonClick}
                                    text={tr('Goals')}
                                    iconRight={<Badge size="s">{project._count.goals}</Badge>}
                                />
                            ) : (
                                <Text color={gray7}>{tr('No goals')}</Text>
                            )}
                        </StyledGoalsButtonContainer>
                        {href && (
                            <NextLink href={href} passHref>
                                <StyledLink target="_blank" onClick={onExternalLinkClick}>
                                    <StyledOpenButton size="s" />
                                </StyledLink>
                            </NextLink>
                        )}
                    </StyledProjectListItem>
                </ProjectListContainer>
            }
            content={children}
            deep={deep}
        >
            {!collapsedGoals && <GoalsListContainer offset={offset}>{goals}</GoalsListContainer>}
        </CollapsableItem>
    );
};
