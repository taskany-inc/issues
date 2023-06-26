import React, { MouseEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Badge, Button } from '@taskany/bricks';
import { gapS } from '@taskany/colors';

import { ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { GoalsListContainer } from '../GoalListItem';
import { CollapsableItem, collapseOffset } from '../CollapsableItem';
import { ProjectListContainer, ProjectListItem } from '../ProjectListItem';

import { tr } from './ProjectListItemCollapsable.i18n';

const StyledGoalsButton = styled(Button)`
    margin-left: ${gapS};
    cursor: pointer;
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
    goalsCounter?: number;
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
    goalsCounter,
    deep = 0,
}) => {
    const contentHidden = collapsed || loading;

    const offset = collapseOffset * (contentHidden ? deep - 1 : deep);
    const childs = useMemo(() => project.children.map(({ id }) => id), [project]);

    const onClickEnabled = childs.length;

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
                        <StyledGoalsButton
                            onClick={onGoalsButtonClick}
                            text={goalsCounter ? tr('Goals') : tr('No goals')}
                            disabled={!goalsCounter}
                            iconRight={goalsCounter ? <Badge size="s">{goalsCounter}</Badge> : null}
                        />
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
