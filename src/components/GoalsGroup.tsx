import React, { MouseEventHandler } from 'react';
import styled from 'styled-components';
import { gapM, gapS } from '@taskany/colors';

import { GoalByIdReturnType } from '../../trpc/inferredTypes';

import { GoalListItem } from './GoalListItem';
import { PageSep } from './PageSep';
import { TableFullWidthCell } from './Table';

interface GoalGroupProps {
    goals: NonNullable<GoalByIdReturnType>[];
    children: React.ReactNode;
    selectedResolver: (id: string) => boolean;

    onClickProvider: (g: NonNullable<GoalByIdReturnType>) => MouseEventHandler<HTMLAnchorElement>;
    onTagClick?: React.ComponentProps<typeof GoalListItem>['onTagClick'];
}

const GoalsGroupContainer = styled(TableFullWidthCell)`
    padding-top: ${gapM};

    &:first-child {
        padding-top: 0;
    }
`;

const GolasGroupSep = styled(PageSep)`
    margin: ${gapS} 0px;
`;

export const GoalsGroup: React.FC<GoalGroupProps> = React.memo(
    ({ goals, children, selectedResolver, onClickProvider, onTagClick }) => (
        <>
            <GoalsGroupContainer>
                {children}
                <GolasGroupSep />
            </GoalsGroupContainer>

            {goals.map((g) => (
                <GoalListItem
                    createdAt={g.createdAt}
                    updatedAt={g.updatedAt}
                    id={g.id}
                    shortId={g._shortId}
                    projectId={g.projectId}
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
    ),
);
