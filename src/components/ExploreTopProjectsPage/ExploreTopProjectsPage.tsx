import { nullable, Table } from '@taskany/bricks';
import NextLink from 'next/link';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { routes } from '../../hooks/router';
import { Page, PageContent } from '../Page';
import { PageSep } from '../PageSep';
import { ExplorePageLayout } from '../ExplorePageLayout/ExplorePageLayout';
import { ProjectListItem } from '../ProjectListItem';
import { trpc } from '../../utils/trpcClient';
import { WrappedRowLink } from '../WrappedRowLink';

import { tr } from './ExploreTopProjectsPage.i18n';

export const ExploreProjectsPage = ({ user, ssrTime }: ExternalPageProps) => {
    const projects = trpc.project.getTop.useQuery();

    if (!projects.data) return null;

    return (
        <Page user={user} ssrTime={ssrTime} title={tr('title')}>
            <ExplorePageLayout>
                <PageSep />

                <PageContent>
                    <Table>
                        {projects.data.map((project) =>
                            nullable(project, (p) => (
                                <NextLink key={p.id} href={routes.project(p.id)} passHref>
                                    <WrappedRowLink>
                                        <ProjectListItem
                                            title={p.title}
                                            owner={p.activity}
                                            starred={p._isStarred}
                                            watching={p._isWatching}
                                            participants={p.participants}
                                            averageScore={p.averageScore}
                                        />
                                    </WrappedRowLink>
                                </NextLink>
                            )),
                        )}
                    </Table>
                </PageContent>
            </ExplorePageLayout>
        </Page>
    );
};
