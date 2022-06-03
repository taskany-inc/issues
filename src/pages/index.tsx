import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';

import { Goal } from '../../graphql/@generated/genql';
import { createFetcher } from '../utils/createFetcher';
import { declareSsrProps } from '../utils/declareSsrProps';
import { declarePage } from '../utils/declarePage';
import { routes } from '../hooks/router';
import { Page } from '../components/Page';

const fetcher = createFetcher((user) => ({
    goalUserIndex: [
        {
            user,
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

export const getServerSideProps = declareSsrProps(async ({ user }) => ({
    ssrData: await fetcher(user),
}));

export default declarePage<{ goalUserIndex: Goal[] }>(({ user, locale, ssrData }) => {
    const t = useTranslations('index');
    const { data } = useSWR('goalUserIndex', () => fetcher(user));
    const goals = data?.goalUserIndex ?? ssrData.goalUserIndex;

    return (
        <Page locale={locale} title={t('title')}>
            <StyledGoalsList>
                <div style={{ width: '100%' }}>
                    {goals.map((goal) => (
                        <Link key={goal.id} href={routes.goal(goal.id)} passHref>
                            <a style={{ width: '100%' }}>
                                {/* <GoalItem
                                            id={goal.id}
                                            title={goal.title}
                                            projectTitle={goal.project?.title}
                                            tags={goal.tags}
                                            issuer={goal.computedIssuer}
                                            createdAt={goal.createdAt}
                                            updatedAt={goal.updatedAt}
                                        /> */}
                            </a>
                        </Link>
                    ))}
                </div>
            </StyledGoalsList>

            <pre>{JSON.stringify(goals, null, 2)}</pre>
        </Page>
    );
});
