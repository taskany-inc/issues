import React, { MouseEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@taskany/bricks';
import { gapS } from '@taskany/colors';

import { ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { GoalsListContainer } from '../GoalListItem';
import { Collapsable, collapseOffset } from '../CollapsableItem';
import { ProjectListContainer, ProjectListItem } from '../ProjectListItem';

import { tr } from './ProjectListItem.i18n';

const StyledGoalsButton = styled(Button)`
    margin-left: ${gapS};
    cursor: pointer;
`;

interface ProjectListItemCollapsableProps {
    href: string;
    project: NonNullable<ProjectByIdReturnType>;
    goals?: ReactNode;
    children?: ReactNode;
    onCollapsedChange?: (value: boolean) => void;
    onGoalsCollapsedChange?: (value: boolean) => void;
    loading?: boolean;
    deep?: number;
}

export const ProjectListItemCollapsable: React.FC<ProjectListItemCollapsableProps> = ({
    project,
    onCollapsedChange,
    onGoalsCollapsedChange,
    children,
    loading = false,
    goals,
    deep = 0,
}) => {
    const [collapsed, setIsCollapsed] = useState(true);
    const [collapsedGoals, setIsCollapsedGoals] = useState(true);

    const offset = collapseOffset * (collapsed ? deep - 1 : deep);
    const childs = useMemo(() => project.children.map(({ id }) => id), [project]);

    const onClickEnabled = childs.length;

    useEffect(() => {
        onCollapsedChange?.(collapsed);
    }, [collapsed, onCollapsedChange]);

    useEffect(() => {
        onGoalsCollapsedChange?.(collapsedGoals);
    }, [collapsedGoals, onGoalsCollapsedChange]);

    const onClick = useCallback(() => {
        if (onClickEnabled) {
            setIsCollapsed((value) => !value);
        }
    }, [onClickEnabled]);

    const onHeaderButtonClick = useCallback((e: MouseEvent) => {
        e.stopPropagation();

        setIsCollapsedGoals((value) => !value);
    }, []);

    return (
        <Collapsable
            collapsed={collapsed || loading}
            onClick={onClick}
            header={
                <ProjectListContainer offset={offset}>
                    <ProjectListItem
                        title={project.title}
                        owner={project.activity}
                        participants={project.participants}
                        starred={project._isStarred}
                        watching={project._isWatching}
                    >
                        <StyledGoalsButton onClick={onHeaderButtonClick} text={tr('Goals')} />
                    </ProjectListItem>
                </ProjectListContainer>
            }
            content={children}
            deep={deep}
        >
            {!collapsedGoals && <GoalsListContainer offset={offset}>{goals}</GoalsListContainer>}
        </Collapsable>
    );
};
