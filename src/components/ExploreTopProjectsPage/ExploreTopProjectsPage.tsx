import { nullable } from '@taskany/bricks';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { routes } from '../../hooks/router';
import { Page, PageContent } from '../Page';
import { PageSep } from '../PageSep';
import { ExplorePageLayout } from '../ExplorePageLayout/ExplorePageLayout';
import { ProjectListContainer, ProjectListItem } from '../ProjectListItem';
import { trpc } from '../../utils/trpcClient';

import { tr } from './ExploreTopProjectsPage.i18n';

export const ExploreProjectsPage = ({ user, ssrTime }: ExternalPageProps) => {
    const projects = trpc.project.getTop.useQuery();

    if (!projects.data) return null;

    return (
        <Page user={user} ssrTime={ssrTime} title={tr('title')}>
            <ExplorePageLayout>
                <PageSep />

                <PageContent>
                    <ProjectListContainer>
                        {projects.data.map((project) =>
                            nullable(project, (p) => (
                                <ProjectListItem
                                    key={p.id}
                                    href={routes.project(p.id)}
                                    title={p.title}
                                    owner={p.activity}
                                    starred={p._isStarred}
                                    watching={p._isWatching}
                                    participants={p.participants}
                                />
                            )),
                        )}
                    </ProjectListContainer>
                </PageContent>
            </ExplorePageLayout>
        </Page>
    );
};
