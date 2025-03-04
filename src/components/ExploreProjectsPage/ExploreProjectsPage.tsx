import { useMemo, useCallback } from 'react';
import { nullable } from '@taskany/bricks';
import { Table } from '@taskany/bricks/harmony';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { routes } from '../../hooks/router';
import { Page } from '../Page/Page';
import { ExplorePageHeader } from '../ExplorePageHeader/ExplorePageHeader';
import { ProjectListItem } from '../ProjectListItem/ProjectListItem';
import { TableRowItem, TableRowItemTitle } from '../TableRowItem/TableRowItem';
import { trpc } from '../../utils/trpcClient';
import { refreshInterval } from '../../utils/config';
import { LoadMoreButton } from '../LoadMoreButton/LoadMoreButton';
import { Loader } from '../Loader/Loader';

import { tr } from './ExploreProjectsPage.i18n';

const pageSize = 20;

export const ExploreProjectsPage = ({ user, ssrTime }: ExternalPageProps) => {
    const { data, hasNextPage, fetchNextPage, fetchStatus } = trpc.v2.project.getAll.useInfiniteQuery(
        {
            limit: pageSize,
        },
        {
            getNextPageParam: ({ pagination }) => pagination.offset,
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    const pages = data?.pages;
    const projectsToRender = useMemo(() => {
        return pages?.flatMap((p) => p.projects);
    }, [pages]);

    const onFetchNextPage = useCallback(() => {
        fetchNextPage();
    }, [fetchNextPage]);

    return (
        <Page user={user} ssrTime={ssrTime} title={tr('title')} header={<ExplorePageHeader />}>
            <Table>
                {nullable(projectsToRender, (projects) =>
                    projects.map((project) =>
                        nullable(project, (p) => (
                            <TableRowItem title={<TableRowItemTitle size="l">{p.title}</TableRowItemTitle>}>
                                <ProjectListItem
                                    href={routes.project(p.id)}
                                    id={p.id}
                                    title={p.title}
                                    flowId={p.flowId}
                                    stargizers={p._count.stargizers}
                                    owner={p.activity}
                                    starred={p._isStarred}
                                    watching={p._isWatching}
                                    participants={p.participants}
                                    averageScore={p.averageScore}
                                    actionButtonView="icons"
                                />
                            </TableRowItem>
                        )),
                    ),
                )}
            </Table>
            {nullable(fetchStatus === 'fetching', () => (
                <Loader />
            ))}
            {nullable(hasNextPage, () => (
                <LoadMoreButton onClick={onFetchNextPage} disabled={fetchStatus === 'fetching'} />
            ))}
        </Page>
    );
};
