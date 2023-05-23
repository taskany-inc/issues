import React, { MouseEventHandler } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { Text, Link, nullable } from '@taskany/bricks';

import { routes } from '../hooks/router';
import { GoalByIdReturnType } from '../../trpc/inferredTypes';

import { GoalListItem } from './GoalListItem/GoalListItem';
import { PageSep } from './PageSep';
import { ProjectTitleList } from './ProjectTitleList';

interface GoalGroupProps {
    goals: NonNullable<GoalByIdReturnType>[];
    children: React.ReactNode;
    selectedResolver: (id: string) => boolean;

    onClickProvider: (g: NonNullable<GoalByIdReturnType>) => MouseEventHandler<HTMLAnchorElement>;
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

interface GoalsGroupProjectTitleProps {
    id: string;
    title: string;
    parent?: Array<{ id: string; title: string }>;
}

export const GoalsGroupProjectTitle: React.FC<GoalsGroupProjectTitleProps> = ({ id, title, parent }) => (
    <Text size="l" weight="bolder">
        {Boolean(parent?.length) &&
            nullable(parent, (p) => (
                <>
                    <ProjectTitleList projects={p} />
                    {' / '}
                </>
            ))}
        <NextLink passHref href={routes.project(id)}>
            <Link inline>{title}</Link>
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
                        updatedAt={g.updatedAt}
                        id={g.id}
                        shortId={g._shortId}
                        state={g.state!}
                        title={g.title}
                        issuer={g.activity!}
                        owner={g.owner!}
                        tags={g.tags}
                        priority={g.priority!}
                        comments={g._count?.comments}
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
