/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect } from 'react';
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
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useWillUnmount } from '../../../hooks/useWillUnmount';

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
            ? {
                  fallback: {
                      [key]: ssrData,
                  },
              }
            : {
                  notFound: true,
              };
    },
    {
        private: true,
    },
);

const TeamPage = ({ user, locale, ssrTime, fallback, params: { key } }: ExternalPageProps) => {
    const t = useTranslations('teams');
    const nextRouter = useNextRouter();
    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);

    const { data } = useSWR(key, () => fetcher(user, key), {
        fallback,
    });

    if (!data) return null;

    const team = data?.team;

    if (!team) return nextRouter.push('/404');

    useEffect(() => {
        setCurrentProjectCache({
            id: team.id,
            key: team.key,
            title: team.title,
            description: team.description,
            flowId: team.flowId,
            kind: 'team',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

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
                    {team?.projects?.map((project) =>
                        nullable(project, (p) => <ProjectListItem key={p.key} project={p} />),
                    )}
                </PageContent>
            </TeamPageLayout>
        </Page>
    );
};

export default TeamPage;
