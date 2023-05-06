import { nullable } from '@taskany/bricks';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { routes } from '../../hooks/router';
import { Page, PageContent } from '../Page';
import { PageSep } from '../PageSep';
import { ExplorePageLayout } from '../ExplorePageLayout/ExplorePageLayout';
import { ProjectListItem } from '../ProjectListItem';
import { trpc } from '../../utils/trpcClient';

import { tr } from './ExploreTopProjectsPage.i18n';

export const ExploreProjectsPage = ({ user, locale, ssrTime }: ExternalPageProps) => {
    const projects = trpc.project.getTop.useQuery();

    if (!projects.data) return null;

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={tr('title')}>
            <ExplorePageLayout>
                <PageSep />

                <PageContent>
                    {projects.data.map((project) =>
                        nullable(project, (p) => (
                            <ProjectListItem
                                key={p.id}
                                href={routes.project(p.id)}
                                createdAt={p.createdAt}
                                title={p.title}
                                description={p.description}
                                ownerImage={p.activity.user?.image}
                                onwerEmail={p.activity.user?.email || p.activity.ghost?.email}
                            />
                        )),
                    )}
                </PageContent>
            </ExplorePageLayout>
        </Page>
    );
};
