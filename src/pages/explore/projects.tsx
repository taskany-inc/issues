import useSWR from 'swr';
import { useTranslations } from 'next-intl';

import { createFetcher, refreshInterval } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { Page, PageContent } from '../../components/Page';
import { PageSep } from '../../components/PageSep';
import { ProjectListItem } from '../../components/ProjectListItem';
import { nullable } from '../../utils/nullable';
import { ExplorePageLayout } from '../../components/ExplorePageLayout';

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

const ExploreProjectsPage = ({
    user,
    locale,
    ssrTime,
    fallback,
}: ExternalPageProps<Awaited<ReturnType<typeof fetcher>>>) => {
    const t = useTranslations('explore');

    const { data } = useSWR('explore/projects', () => fetcher(user), {
        fallback,
        refreshInterval,
    });
    const projects = data?.projects;

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={t('projects.title')}>
            <ExplorePageLayout>
                <PageSep />

                <PageContent>
                    {projects?.map((project) => nullable(project, (p) => <ProjectListItem key={p.key} project={p} />))}
                </PageContent>
            </ExplorePageLayout>
        </Page>
    );
};

export default ExploreProjectsPage;
