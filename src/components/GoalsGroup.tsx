/* eslint-disable prefer-arrow-callback */
import React, { MouseEventHandler } from 'react';
import styled from 'styled-components';
import { gapM, gapS } from '@taskany/colors';
import { Table } from '@taskany/bricks';
import NextLink from 'next/link';

import { ActivityByIdReturnType, GoalByIdReturnType } from '../../trpc/inferredTypes';
import { routes } from '../hooks/router';

import { GoalListItem } from './GoalListItem';
import { PageSep } from './PageSep';
import { TableFullWidthCell } from './Table';
import { WrappedRowLink } from './WrappedRowLink';
import { ProjectListItem } from './ProjectListItem';

type GoalGroupProps = {
    goals: NonNullable<GoalByIdReturnType>[];
    selectedResolver: (id: string) => boolean;

    onClickProvider: (g: NonNullable<GoalByIdReturnType>) => MouseEventHandler<HTMLAnchorElement>;
    onTagClick?: React.ComponentProps<typeof GoalListItem>['onTagClick'];
    project: {
        id: string;
        title: string;
        averageScore: number | null;
        activity?: ActivityByIdReturnType;
        participants?: ActivityByIdReturnType[];
        _isStarred?: boolean;
        _isWatching?: boolean;
    };
};

const GoalsGroupContainer = styled(TableFullWidthCell)`
    padding-top: ${gapM};

    &:first-child {
        padding-top: 0;
    }
`;

const GolasGroupSep = styled(PageSep)`
    margin: ${gapS} 0px;
`;

export const GoalsGroup = React.memo<GoalGroupProps>(function GoalsGroup({
    goals,
    selectedResolver,
    onClickProvider,
    onTagClick,
    project,
}) {
    return (
        <>
            <GoalsGroupContainer>
                <Table>
                    <NextLink href={routes.project(project.id)} passHref legacyBehavior>
                        <WrappedRowLink>
                            <ProjectListItem
                                title={project.title}
                                owner={project.activity}
                                participants={project.participants}
                                starred={project._isStarred}
                                watching={project._isWatching}
                                averageScore={project.averageScore}
                            />
                        </WrappedRowLink>
                    </NextLink>
                </Table>
                <GolasGroupSep />
            </GoalsGroupContainer>

            {goals.map((g) => (
                <GoalListItem
                    createdAt={g.createdAt}
                    updatedAt={g.updatedAt}
                    id={g.id}
                    shortId={g._shortId}
                    state={g.state}
                    title={g.title}
                    issuer={g.activity}
                    owner={g.owner}
                    tags={g.tags}
                    priority={g.priority}
                    comments={g._count?.comments}
                    estimate={g._estimate?.length ? g._estimate[g._estimate.length - 1] : undefined}
                    participants={g.participants}
                    starred={g._isStarred}
                    watching={g._isWatching}
                    achivedCriteriaWeight={g._achivedCriteriaWeight}
                    key={g.id}
                    focused={selectedResolver(g.id)}
                    onClick={onClickProvider(g)}
                    onTagClick={onTagClick}
                />
            ))}
        </>
    );
});
