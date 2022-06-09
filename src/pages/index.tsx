import React from 'react';
import useSWRInfinite from 'swr/infinite';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';

import { Goal } from '../../graphql/@generated/genql';
import { createFetcher } from '../utils/createFetcher';
import { declareSsrProps } from '../utils/declareSsrProps';
import { declarePage } from '../utils/declarePage';
import { Page } from '../components/Page';
import { GoalItem } from '../components/GoalItem';
import { Button } from '../components/Button';

const PAGE_SIZE = 5;

const fetcher = createFetcher((user, offset: number | undefined = 0) => ({
    goalUserIndex: [
        {
            user,
            offset,
            pageSize: PAGE_SIZE,
        },
        {
            id: true,
            title: true,
            description: true,
            project: {
                id: true,
                title: true,
            },
            state: {
                id: true,
                title: true,
            },
            computedIssuer: {
                id: true,
                name: true,
                email: true,
            },
            computedOwner: {
                id: true,
                name: true,
                email: true,
            },
            tags: {
                id: true,
                title: true,
                description: true,
            },
            createdAt: true,
            updatedAt: true,
        },
    ],
}));

const StyledGoalsList = styled.div`
    padding: 20px 20px 0 20px;
`;

const StyledLoadMore = styled.div`
    margin: 50px 40px;
`;

export const getServerSideProps = declareSsrProps(async ({ user }) => ({
    ssrData: await fetcher(user),
}));

export default declarePage<{ goalUserIndex: Goal[] }>(({ user, locale, ssrData }) => {
    const t = useTranslations('index');

    const { data, setSize, size } = useSWRInfinite(
        (index: number) => ({ offset: index * PAGE_SIZE }),
        ({ offset }) => fetcher(user, offset),
    );

    const shouldRenderMoreButton = data?.[data.length - 1]?.goalUserIndex?.length === PAGE_SIZE;

    // FIXME: https://github.com/taskany-inc/issues/issues/107
    const goals = data?.map((chunk) => chunk.goalUserIndex).flat() ?? ssrData.goalUserIndex;

    return (
        <Page locale={locale} title={t('title')}>
            <StyledGoalsList>
                <div style={{ width: '100%' }}>
                    {goals?.map(
                        (goal) =>
                            goal && (
                                <GoalItem
                                    createdAt={goal.createdAt}
                                    id={goal.id}
                                    state={goal.state}
                                    title={goal.title}
                                    issuer={goal.computedIssuer}
                                    owner={goal.computedOwner}
                                    key={goal.id}
                                />
                            ),
                    )}
                </div>

                <StyledLoadMore>
                    {shouldRenderMoreButton && <Button text={t('Load more')} onClick={() => setSize(size + 1)} />}
                </StyledLoadMore>
            </StyledGoalsList>
        </Page>
    );
});
