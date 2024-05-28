import { nullable } from '@taskany/bricks';
import { Table, Link } from '@taskany/bricks/harmony';
import NextLink from 'next/link';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { routes } from '../../hooks/router';
import { Page } from '../Page/Page';
import { ExplorePageHeader } from '../ExplorePageHeader/ExplorePageHeader';
import { ProjectListItem } from '../ProjectListItem/ProjectListItem';
import { TableRowItem, TableRowItemTitle } from '../TableRowItem/TableRowItem';
import { trpc } from '../../utils/trpcClient';

import { tr } from './ExploreProjectsPage.i18n';

export const ExploreProjectsPage = ({ user, ssrTime }: ExternalPageProps) => {
    const { data } = trpc.project.getAll.useQuery();

    if (!data?.projects) return null;

    return (
        <Page user={user} ssrTime={ssrTime} title={tr('title')} header={<ExplorePageHeader />}>
            <Table>
                {data.projects.map((project) =>
                    nullable(project, (p) => (
                        <NextLink key={p.id} href={routes.project(p.id)} passHref legacyBehavior>
                            <Link>
                                <TableRowItem title={<TableRowItemTitle size="l">{p.title}</TableRowItemTitle>}>
                                    <ProjectListItem
                                        id={p.id}
                                        stargizers={p._count.stargizers}
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
        </Page>
    );
};
