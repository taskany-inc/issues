import React from 'react';
import useSWRInfinite from 'swr/infinite';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';

import { Goal } from '../../../graphql/@generated/genql';
import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { Page } from '../../components/Page';
import { GoalItem } from '../../components/GoalItem';
import { Button } from '../../components/Button';
import { nullable } from '../../utils/nullable';

const PAGE_SIZE = 5;

const fetcher = createFetcher((_, offset: number | undefined = 0) => ({
    goalUserIndex: [
        {
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
                hue: true,
            },
            computedActivity: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
            computedOwner: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
            tags: {
                id: true,
                title: true,
                description: true,
            },
            comments: {
                id: true,
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

export const getServerSideProps = declareSsrProps(
    async () => ({
        ssrData: await fetcher(),
    }),
    {
        private: true,
    },
);

const GoalsPage = ({ user, locale, ssrData }: ExternalPageProps<{ goalUserIndex: Goal[] }>) => {
    const t = useTranslations('goals.index');

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
                {goals?.map((goal) =>
                    nullable(goal, (g) => (
                        <GoalItem
                            createdAt={g.createdAt}
                            id={g.id}
                            state={g.state}
                            title={g.title}
                            issuer={g.computedActivity}
                            owner={g.computedOwner}
                            tags={g.tags}
                            comments={g.comments?.length}
                            key={g.id}
                        />
                    )),
                )}

                <StyledLoadMore>
                    {shouldRenderMoreButton && <Button text={t('Load more')} onClick={() => setSize(size + 1)} />}
                </StyledLoadMore>
            </StyledGoalsList>
        </Page>
    );
};

export default GoalsPage;
