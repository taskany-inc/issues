import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';

import { createFetcher } from '../utils/createFetcher';
import { Page } from '../components/Page';
import { routes } from '../hooks/router';
import { ssrProps, ExternalPageProps } from '../utils/ssrProps';

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
                color: true,
            },
            createdAt: true,
            updatedAt: true,
        },
    ],
}));

const StyledGoalsList = styled.div`
    padding: 20px 20px 0 20px;
`;

export const getServerSideProps = ssrProps(async ({ user }) => ({
    ssrData: await fetcher(user),
}));

const Home = ({ user, locale, ssrData }: ExternalPageProps) => {
    const t = useTranslations('index');
    const { data } = useSWR('goalUserIndex', () => fetcher(user));
    const actualData: typeof data = data ?? ssrData;

    return (
        <Page locale={locale} title={t('title')}>
            <StyledGoalsList>
                <div style={{ width: '100%' }}>
                    {actualData?.goalUserIndex?.map((goal) => (
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

            <pre>{JSON.stringify(actualData?.goalUserIndex, null, 2)}</pre>
        </Page>
    );
};

export default Home;
