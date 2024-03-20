import { nullable } from '@taskany/bricks';
import { Table, Link } from '@taskany/bricks/harmony';
import NextLink from 'next/link';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { routes } from '../../hooks/router';
import { Page } from '../Page/Page';
import { PageContent } from '../PageContent/PageContent';
import { ExplorePageLayout } from '../ExplorePageLayout/ExplorePageLayout';
import { ProjectListItem } from '../ProjectListItem/ProjectListItem';
import { trpc } from '../../utils/trpcClient';
import { TableRowItem, Title } from '../Table/Table';

import { tr } from './ExploreProjectsPage.i18n';

export const ExploreProjectsPage = ({ user, ssrTime }: ExternalPageProps) => {
    const { data } = trpc.project.getAll.useQuery();

    if (!data?.projects) return null;

    return (
        <Page user={user} ssrTime={ssrTime} title={tr('title')}>
            <ExplorePageLayout>
                <PageContent>
                    <Table>
                        {data.projects.map((project) =>
                            nullable(project, (p) => (
                                <NextLink key={p.id} href={routes.project(p.id)} passHref legacyBehavior>
                                    <Link>
                                        <TableRowItem title={<Title size="l">{p.title}</Title>}>
                                            <ProjectListItem
                                                owner={p.activity}
                                                starred={p._isStarred}
                                                watching={p._isWatching}
                                                participants={p.participants}
                                                averageScore={p.averageScore}
                                            />
                                        </TableRowItem>
                                    </Link>
                                </NextLink>
                            )),
                        )}
                    </Table>
                </PageContent>
            </ExplorePageLayout>
        </Page>
    );
};
