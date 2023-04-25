import useSWR from 'swr';
import { nullable } from '@taskany/bricks';

import { Project } from '../../../../graphql/@generated/genql';
import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { routes } from '../../../hooks/router';
import { Page, PageContent } from '../../Page';
import { PageSep } from '../../PageSep';
import { ExplorePageLayout } from '../../ExplorePageLayout/ExplorePageLayout';
import { ProjectListItem } from '../../ProjectListItem';

import { tr } from './ExploreTopProjectsPage.i18n';

const fetcher = createFetcher(() => ({
    topProjects: {
        id: true,
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
}));

export const getServerSideProps = declareSsrProps(
    async ({ user }) => ({
        fallback: {
            'explore/projects': await fetcher(user),
        },
    }),
    {
        private: true,
    },
);

export const ExploreTopProjectsPage = ({
    user,
    locale,
    ssrTime,
    fallback,
}: ExternalPageProps<Awaited<ReturnType<typeof fetcher>>>) => {
    const { data } = useSWR('explore/projects', () => fetcher(user), {
        fallback,
        refreshInterval,
    });
    const projects = data?.topProjects;

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={tr('title')}>
            <ExplorePageLayout>
                <PageSep />

                <PageContent>
                    {projects?.map((project: Project) =>
                        nullable(project, (p) => (
                            <ProjectListItem
                                key={p.id}
                                href={routes.project(p.id)}
                                createdAt={p.createdAt}
                                title={p.title}
                                description={p.description}
                                activity={p.activity}
                            />
                        )),
                    )}
                </PageContent>
            </ExplorePageLayout>
        </Page>
    );
};
