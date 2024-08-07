import { nullable } from '@taskany/bricks';
import { Table, Link, Text, Card, CardContent } from '@taskany/bricks/harmony';
import NextLink from 'next/link';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { routes } from '../../hooks/router';
import { Page } from '../Page/Page';
import { ProjectListItem } from '../ProjectListItem/ProjectListItem';
import { TableRowItem, TableRowItemTitle } from '../TableRowItem/TableRowItem';
import { trpc } from '../../utils/trpcClient';
import { CommonHeader } from '../CommonHeader';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';

import { tr } from './ExploreProjectsStarredPage.i18n';
import classes from './ExploreProjectsStarredPage.module.css';

export const ExploreProjectsStarredPage = ({ user, ssrTime }: ExternalPageProps) => {
    const { data } = trpc.v2.project.starred.useQuery();

    return (
        <Page user={user} ssrTime={ssrTime} title={tr('title')} header={<CommonHeader title={tr('Starred')} />}>
            {nullable(data, (projects) =>
                nullable(
                    projects.length,
                    () => (
                        <Table>
                            {projects.map((project) =>
                                nullable(project, (p) => (
                                    <NextLink key={p.id} href={routes.project(p.id)} passHref legacyBehavior>
                                        <Link>
                                            <TableRowItem
                                                title={<TableRowItemTitle size="l">{p.title}</TableRowItemTitle>}
                                            >
                                                <ProjectListItem
                                                    title={p.title}
                                                    flowId={p.flowId}
                                                    id={p.id}
                                                    stargizers={p._count.stargizers}
                                                    owner={p.activity}
                                                    starred={!!p._isStarred}
                                                    watching={!!p._isWatching}
                                                    participants={p.participants as ActivityByIdReturnType[]}
                                                    averageScore={p.averageScore}
                                                />
                                            </TableRowItem>
                                        </Link>
                                    </NextLink>
                                )),
                            )}
                        </Table>
                    ),
                    <Card className={classes.EmptyStarredProjectsCard}>
                        <CardContent>
                            <Text weight="thin" as="span">
                                {tr("You haven't starred any projects")}{' '}
                                {tr('Go to any project page and mark it with a star')}
                            </Text>
                            <NextLink href={routes.exploreProjects()} passHref legacyBehavior>
                                <Link view="secondary">
                                    <Text>{tr('All projects')}</Text>
                                </Link>
                            </NextLink>
                        </CardContent>
                    </Card>,
                ),
            )}
        </Page>
    );
};
