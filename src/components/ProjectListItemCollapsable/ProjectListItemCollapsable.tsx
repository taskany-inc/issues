import React, { MouseEvent, ReactNode, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Badge, Button, Text } from '@taskany/bricks';
import { gapM, gray7 } from '@taskany/colors';

import { ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { GoalsListContainer } from '../GoalListItem';
import { CollapsableItem, collapseOffset } from '../CollapsableItem';
import { ProjectListContainer, ProjectListItem } from '../ProjectListItem';

import { tr } from './ProjectListItemCollapsable.i18n';

const StyledGoalsButtonContainer = styled.div`
    margin-left: ${gapM};
`;

interface ProjectListItemCollapsableProps {
    href: string;
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

    return (
        <CollapsableItem
            collapsed={contentHidden}
            onClick={onClickEnabled ? onClick : undefined}
            header={
                <ProjectListContainer offset={offset}>
                    <ProjectListItem
                        title={project.title}
                        owner={project.activity}
                        participants={project.participants}
                        starred={project._isStarred}
                        watching={project._isWatching}
                    >
                        <StyledGoalsButtonContainer>
                            {project._count.goals ? (
                                <Button
                                    ghost={collapsedGoals}
                                    onClick={onGoalsButtonClick}
                                    text={tr('Goals')}
                                    iconRight={<Badge size="s">{project._count.goals}</Badge>}
                                />
                            ) : (
                                <Text color={gray7}>{tr('No goals')}</Text>
                            )}
                        </StyledGoalsButtonContainer>
                    </ProjectListItem>
                </ProjectListContainer>
            }
            content={children}
            deep={deep}
        >
            {!collapsedGoals && <GoalsListContainer offset={offset}>{goals}</GoalsListContainer>}
        </CollapsableItem>
    );
};
