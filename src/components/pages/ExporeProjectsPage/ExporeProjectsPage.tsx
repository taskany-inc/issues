import useSWR from 'swr';

import { Project } from '../../../../graphql/@generated/genql';
import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { routes } from '../../../hooks/router';
import { Page, PageContent } from '../../Page';
import { PageSep } from '../../PageSep';
import { nullable } from '../../../utils/nullable';
import { ExplorePageLayout } from '../../ExplorePageLayout';
import { ParentListItem } from '../../ParentListItem';

import { tr } from './ExporeProjectsPage.i18n';

const fetcher = createFetcher(() => ({
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

export const ExploreProjectsPage = ({
    user,
    locale,
    ssrTime,
    fallback,
}: ExternalPageProps<Awaited<ReturnType<typeof fetcher>>>) => {
    const { data } = useSWR('explore/projects', () => fetcher(user), {
        fallback,
        refreshInterval,
    });
    const projects = data?.projects;

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={tr('title')}>
            <ExplorePageLayout>
                <PageSep />

                <PageContent>
                    {projects?.map((project: Project) =>
                        nullable(project, (p) => (
                            <ParentListItem
                                key={p.key}
                                href={routes.project(p.key)}
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
