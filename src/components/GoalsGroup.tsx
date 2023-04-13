import React, { MouseEventHandler } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { Text, Link, nullable } from '@taskany/bricks';

import { Goal, Project } from '../../graphql/@generated/genql';
import { routes } from '../hooks/router';

import { GoalListItem } from './GoalListItem';
import { PageSep } from './PageSep';
import { ProjectTitleList } from './ProjectTitleList';

interface GoalGroupProps {
    goals: Goal[];
    children: React.ReactNode;
    selectedResolver: (id: string) => boolean;

    onClickProvider: (g: Goal) => MouseEventHandler<HTMLAnchorElement>;
    onTagClick?: React.ComponentProps<typeof GoalListItem>['onTagClick'];
}

const StyledGoalsList = styled.div`
    padding: 0;
    margin: 0 -20px;
`;

const StyledGoalsGroup = styled.div`
    padding: 0 20px 40px 20px;
    margin: 0 -20px;
`;

export const GoalsGroupProjectTitle = ({ project }: { project: Project }) => (
    <Text size="l" weight="bolder">
        {Boolean(project.parent?.length) &&
            nullable(project.parent, (parent) => (
                <>
                    <ProjectTitleList projects={parent} />
                    {' / '}
                </>
            ))}
        <NextLink passHref href={routes.project(project.id)}>
            <Link inline>{project.title}</Link>
        </NextLink>
    </Text>
);

export const GoalsGroup: React.FC<GoalGroupProps> = React.memo(
    ({ goals, children, selectedResolver, onClickProvider, onTagClick }) => (
        <StyledGoalsGroup>
            {children}

            <PageSep />

            <StyledGoalsList>
                {goals.map((g) => (
                    <GoalListItem
                        createdAt={g.createdAt}
                        id={g.id}
                        state={g.state}
                        title={g.title}
                        issuer={g.activity}
                        owner={g.owner}
                        tags={g.tags}
                        priority={g.priority}
                        comments={g.comments?.length}
                        key={g.id}
                        focused={selectedResolver(g.id)}
                        onClick={onClickProvider(g)}
                        onTagClick={onTagClick}
                    />
                ))}
            </StyledGoalsList>
        </StyledGoalsGroup>
    ),
);
