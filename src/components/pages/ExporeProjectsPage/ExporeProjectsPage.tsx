import useSWR from 'swr';

import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { Page, PageContent } from '../../Page';
import { PageSep } from '../../PageSep';
import { ProjectListItem } from '../../ProjectListItem';
import { nullable } from '../../../utils/nullable';
import { ExplorePageLayout } from '../../ExplorePageLayout';

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
                    {projects?.map((project) => nullable(project, (p) => <ProjectListItem key={p.key} project={p} />))}
                </PageContent>
            </ExplorePageLayout>
        </Page>
    );
};
