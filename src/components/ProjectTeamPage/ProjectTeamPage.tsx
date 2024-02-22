import { nullable } from '@taskany/bricks';
import { Link, Table, TreeView, TreeViewElement, TreeViewNode } from '@taskany/bricks/harmony';
import { useCallback, useMemo } from 'react';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { routes } from '../../hooks/router';
import { useProjectResource } from '../../hooks/useProjectResource';
import { trpc } from '../../utils/trpcClient';
import { pageHeader } from '../../utils/domObjects';
import { PageContent } from '../PageContent/PageContent';
import { Page } from '../Page/Page';
import { ProjectPageTabs } from '../ProjectPageTabs/ProjectPageTabs';
import { TeamListItem } from '../TeamListItem/TeamListItem';
import { TeamComboBox } from '../TeamComboBox/TeamComboBox';
import { CommonHeader } from '../CommonHeader';
import { PageSep } from '../PageSep';
import { TeamMemberListItem } from '../TeamMemberListItem/TeamMemberListItem';
import { Team } from '../../types/crew';

import { tr } from './ProjectTeamPage.i18n';
import s from './ProjectTeamPage.module.css';

export const ProjectTeamPage = ({ user, ssrTime, params: { id } }: ExternalPageProps) => {
    const { data: project } = trpc.project.getById.useQuery({ id });
    const { updateProjectTeams } = useProjectResource(id);

    const ids = useMemo(() => project?.teams.map(({ externalTeamId }) => externalTeamId) ?? [], [project]);

    const enabledTeamsRequest = Boolean(ids.length);

    const { data: teams } = trpc.crew.getTeamByIds.useQuery(
        { ids },
        {
            keepPreviousData: enabledTeamsRequest,
            enabled: enabledTeamsRequest,
        },
    );

    const onRemove = useCallback(
        ({ id }: Team) => {
            if (project) {
                updateProjectTeams({
                    id: project.id,
                    teams: project.teams.reduce<string[]>((acum, { externalTeamId }) => {
                        if (externalTeamId !== id) {
                            acum.push(externalTeamId);
                        }
                        return acum;
                    }, []),
                });
            }
        },
        [project, updateProjectTeams],
    );

    if (!project) return null;

    const pageTitle = tr
        .raw('title', {
            project: project.title,
        })
        .join('');

    return (
        <Page user={user} ssrTime={ssrTime} title={pageTitle}>
            <CommonHeader title={project.title} description={project.description} {...pageHeader.attr}>
                <ProjectPageTabs id={id} editable={project?._isEditable} />
            </CommonHeader>

            <PageSep />

            <PageContent>
                {nullable(project._isEditable, () => (
                    <div className={s.ProjectTeamPageActions}>
                        <TeamComboBox project={project} text={tr('Add team')} placeholder={tr('Enter the title')} />
                    </div>
                ))}
                {nullable(teams, (ts) => (
                    <TreeView>
                        {ts.map((t) => (
                            <TreeViewNode
                                title={
                                    <Link
                                        className={s.ProjectTeamPageTeamLink}
                                        href={routes.crewTeam(t.id)}
                                        target="_blank"
                                    >
                                        <TeamListItem name={t.name} units={t.units} onRemoveClick={() => onRemove(t)} />
                                    </Link>
                                }
                                key={t.id}
                                visible
                            >
                                <TreeViewElement>
                                    <Table>
                                        {t.memberships.map(({ user, roles, percentage }) => (
                                            <Link
                                                key={user.id}
                                                className={s.ProjectTeamPageTeamLink}
                                                target="_blank"
                                                href={routes.crewUser(user.id)}
                                            >
                                                <TeamMemberListItem
                                                    roles={roles}
                                                    name={user.name}
                                                    email={user.email}
                                                    percentage={percentage}
                                                />
                                            </Link>
                                        ))}
                                    </Table>
                                </TreeViewElement>
                            </TreeViewNode>
                        ))}
                    </TreeView>
                ))}
            </PageContent>
        </Page>
    );
};
