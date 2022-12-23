import useSWR from 'swr';
import { useTranslations } from 'next-intl';

import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { Project } from '../../../graphql/@generated/genql';
import { Page, PageContent } from '../../components/Page';
import { PageSep } from '../../components/PageSep';
import { ProjectListItem } from '../../components/ProjectListItem';
import { nullable } from '../../utils/nullable';
import { ExplorePageLayout } from '../../components/ExplorePageLayout';

const refreshInterval = 3000;

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
        ssrData: await fetcher(user),
    }),
    {
        private: true,
    },
);

const ExploreProjectsPage = ({ user, locale, ssrTime, ssrData }: ExternalPageProps<{ projects: Project[] }>) => {
    const t = useTranslations('explore');

    const { data } = useSWR([user], (...args) => fetcher(...args), {
        refreshInterval,
    });
    const projects: Project[] | null = data?.projects ?? ssrData.projects;

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={t('projects.title')}>
            <ExplorePageLayout>
                <PageSep />

                <PageContent>
                    {projects?.map((project) =>
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
            </ExplorePageLayout>
        </Page>
    );
};

export default ExploreProjectsPage;
