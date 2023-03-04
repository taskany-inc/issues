import React from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { useRouter as useNextRouter } from 'next/router';

import { createFetcher } from '../../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { nullable } from '../../../utils/nullable';
import { ProjectListItem } from '../../../components/ProjectListItem';
import { TeamPageLayout } from '../../../components/TeamPageLayout';
import { PageSep } from '../../../components/PageSep';
import { Page, PageContent } from '../../../components/Page';
import { Project } from '../../../../graphql/@generated/genql';

const fetcher = createFetcher((_, key: string) => ({
    team: [
        {
            key,
        },
        {
            id: true,
            key: true,
            title: true,
            description: true,
            activityId: true,
            projects: {
                key: true,
                title: true,
                description: true,
                createdAt: true,
                activity: {
                    user: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                    ghost: {
                        id: true,
                        email: true,
                    },
                },
            },
            watchers: {
                id: true,
            },
            stargizers: {
                id: true,
            },
            participants: {
                id: true,
                user: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            createdAt: true,
            activity: {
                id: true,
                user: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
                ghost: {
                    id: true,
                    email: true,
                },
            },
        },
    ],
}));

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { key } }) => {
        const ssrData = await fetcher(user, key);

        return ssrData.team
            ? { ssrData }
            : {
                  notFound: true,
              };
    },
    {
        private: true,
    },
);

const TeamPage = ({
    user,
    locale,
    ssrTime,
    ssrData,
    params: { key },
}: ExternalPageProps<Awaited<ReturnType<typeof fetcher>>, { key: string }>) => {
    const t = useTranslations('teams');
    const nextRouter = useNextRouter();

    const { data } = useSWR([user, key], fetcher, {
        fallbackData: ssrData,
    });

    if (!data) return null;

    const team = data?.team;

    if (!team) return nextRouter.push('/404');

    return (
        <Page
            user={user}
            locale={locale}
            ssrTime={ssrTime}
            title={t.rich('index.title', {
                team: () => team?.title,
            })}
        >
            <TeamPageLayout actions team={team}>
                <PageSep />

                <PageContent>
                    {team?.projects?.map((project: Project) =>
                        nullable(project, (p) => <ProjectListItem key={p.key} project={p} />),
                    )}
                </PageContent>
            </TeamPageLayout>
        </Page>
    );
};

export default TeamPage;
