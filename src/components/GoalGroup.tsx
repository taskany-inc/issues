import React, { MouseEventHandler } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';

import { Goal } from '../../graphql/@generated/genql';
import { ProjectGroup, TeamGroup } from '../hooks/useGrouppedGoals';
import { nullable } from '../utils/nullable';
import { routes } from '../hooks/router';

import { GoalListItem } from './GoalListItem';
import { PageSep } from './PageSep';
import { Text } from './Text';
import { Link } from './Link';
import { TeamTitleList } from './TeamTitleList';

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

export const GoalsGroupProjectTitle = ({ project }: { project: ProjectGroup }) => (
    <Text size="l" weight="bolder">
        {nullable(project.teams, (teams) => (
            <>
                <TeamTitleList teams={teams} />
                {' — '}
            </>
        ))}
        <NextLink passHref href={routes.project(project.data.key)}>
            <Link inline>{project.data.title}</Link>
        </NextLink>
    </Text>
);

export const GoalsGroupTeamTitle = ({ team }: { team: TeamGroup }) => (
    <Text size="l" weight="bolder">
        <NextLink passHref href={routes.team(team.data.slug)}>
            <Link inline>{team.data.title}</Link>
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
