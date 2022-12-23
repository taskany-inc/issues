import React from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';

import { createFetcher } from '../../../utils/createFetcher';
import { Team } from '../../../../graphql/@generated/genql';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { nullable } from '../../../utils/nullable';
import { ProjectListItem } from '../../../components/ProjectListItem';
import { TeamPageLayout } from '../../../components/TeamPageLayout';
import { PageSep } from '../../../components/PageSep';
import { PageContent } from '../../../components/Page';

const fetcher = createFetcher((_, slug: string) => ({
    team: [
        {
            slug,
        },
        {
            id: true,
            slug: true,
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
    async ({ user, params: { slug } }) => {
        const ssrProps = {
            ssrData: await fetcher(user, slug),
        };

        if (!ssrProps.ssrData.team) {
            return {
                notFound: true,
            };
        }

        return ssrProps;
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
    params: { slug },
}: ExternalPageProps<{ team: Team }, { slug: string }>) => {
    const t = useTranslations('teams');

    const { data } = useSWR([user, slug], (...args) => fetcher(...args));
    const team: Team = data?.team ?? ssrData.team;

    return (
        <TeamPageLayout
            actions
            user={user}
            locale={locale}
            ssrTime={ssrTime}
            title={t.rich('index.title', {
                team: () => team.title,
            })}
            team={team}
        >
            <PageSep />

            <PageContent>
                {team?.projects?.map((project) =>
                    nullable(project, (p) => (
                        <ProjectListItem
                            key={p.key}
                            projectKey={p.key}
                            title={p.title}
                            description={p.description}
                            createdAt={p.createdAt}
                            owner={p.activity}
                        />
                    )),
                )}
            </PageContent>
        </TeamPageLayout>
    );
};

export default TeamPage;
