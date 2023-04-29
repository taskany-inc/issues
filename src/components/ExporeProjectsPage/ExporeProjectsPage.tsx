import useSWR from 'swr';
import { nullable } from '@taskany/bricks';

import { Project } from '../../../graphql/@generated/genql';
import { createFetcher, refreshInterval } from '../../utils/createFetcher';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { routes } from '../../hooks/router';
import { Page, PageContent } from '../Page';
import { PageSep } from '../PageSep';
import { ExplorePageLayout } from '../ExplorePageLayout/ExplorePageLayout';
import { ProjectListItem } from '../ProjectListItem';

import { tr } from './ExporeProjectsPage.i18n';

export const exploreProjectsFetcher = createFetcher(() => ({
    projects: {
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

export const ExploreProjectsPage = ({
    user,
    locale,
    ssrTime,
    fallback,
}: ExternalPageProps<Awaited<ReturnType<typeof exploreProjectsFetcher>>>) => {
    const { data } = useSWR('explore/projects', () => exploreProjectsFetcher(user), {
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
