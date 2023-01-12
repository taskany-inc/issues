import React, { MouseEventHandler, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { createFetcher } from '../../../utils/createFetcher';
import { Goal, Project, Team } from '../../../../graphql/@generated/genql';
import { GoalListItem } from '../../../components/GoalListItem';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { nullable } from '../../../utils/nullable';
import { FiltersPanel } from '../../../components/FiltersPanel';
import { defaultLimit } from '../../../components/LimitFilterDropdown';
import { useUrlParams } from '../../../hooks/useUrlParams';
import { TeamPageLayout } from '../../../components/TeamPageLayout';
import { Page, PageContent } from '../../../components/Page';
import { Text } from '../../../components/Text';
import { PageSep } from '../../../components/PageSep';

const GoalPreview = dynamic(() => import('../../../components/GoalPreview'));

const refreshInterval = 3000;
const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

const fetcher = createFetcher((_, slug, states = [], query = '', tags = [], owner = []) => ({
    team: [
        {
            slug,
        },
        {
            id: true,
            slug: true,
            title: true,
            description: true,
            activityId: true,
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
            watchers: {
                id: true,
            },
            stargizers: {
                id: true,
            },
            participants: {
                id: true,
                user: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            createdAt: true,
            activity: {
                id: true,
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
    ],
    teamGoals: [
        {
            data: {
                slug,
                states,
                tags,
                owner,
                query,
            },
        },
        {
            key: true,
            title: true,
            flowId: true,
            goals: {
                id: true,
                title: true,
                description: true,
                project: {
                    id: true,
                    key: true,
                    title: true,
                },
                state: {
                    id: true,
                    title: true,
                    hue: true,
                },
                activity: {
                    id: true,
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
                owner: {
                    id: true,
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
                tags: {
                    id: true,
                    title: true,
                    description: true,
                },
                comments: {
                    id: true,
                },
                createdAt: true,
                updatedAt: true,
            },
        },
    ],
}));

const StyledGoalsList = styled.div`
    padding: 0;
    margin: 0 -20px;
`;

const StyledProjectGroup = styled.div`
    padding: 0 20px 40px 20px;
    margin: 0 -20px;
`;

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { slug } }) => {
        const ssrProps = {
            ssrData: await fetcher(user, slug),
        };

        if (!ssrProps.ssrData.team) {
            return {
                notFound: true,
            };
        }

        return ssrProps;
    },
    {
        private: true,
    },
);

const TeamGoalsPage = ({
    user,
    locale,
    ssrTime,
    ssrData,
    params: { slug },
}: ExternalPageProps<{ team: Team; teamGoals: Project[] }, { slug: string }>) => {
    const t = useTranslations('teams');
    const router = useRouter();

    const [stateFilter, setStateFilter] = useState<string[]>(parseQueryParam(router.query.state as string));
    const [tagsFilter, setTagsFilter] = useState<string[]>(parseQueryParam(router.query.tags as string));
    const [ownerFilter, setOwnerFilter] = useState<string[]>(parseQueryParam(router.query.user as string));
    const [fulltextFilter, setFulltextFilter] = useState(parseQueryParam(router.query.search as string).toString());
    const [limitFilter, setLimitFilter] = useState(Number(router.query.limit) || defaultLimit);

    const [preview, setPreview] = useState<Goal | null>(null);

    const { data } = useSWR(
        [user, slug, stateFilter, fulltextFilter, tagsFilter, ownerFilter, limitFilter],
        (...args) => fetcher(...args),
        {
            refreshInterval,
        },
    );

    const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFulltextFilter(e.currentTarget.value);
    }, []);

    const team: Team = data?.team ?? ssrData.team;
    const projects: Project[] = data?.teamGoals ?? ssrData.teamGoals;

    const [usersFilterData, tagsFilterData, goalsCount] = useMemo(() => {
        const projectsData = new Map();
        const tagsData = new Map();
        const usersData = new Map();
        let goalsCount = 0;

        projects.forEach((p) => {
            projectsData.set(p.id, {
                id: p.id,
                tittle: p.title,
            });

            p.goals?.forEach((g) => {
                goalsCount++;
                usersData.set(g?.owner?.id, g?.owner);
                g?.tags?.forEach((t) => tagsData.set(t?.id, t));
            });
        });

        return [
            Array.from(usersData.values()),
            Array.from(tagsData.values()),
            goalsCount,
            Array.from(projectsData.values()), // https://github.com/taskany-inc/issues/issues/438
        ];
    }, [projects]);

    useUrlParams(stateFilter, tagsFilter, ownerFilter, fulltextFilter, limitFilter);

    const onGoalPrewiewShow = useCallback(
        (goal: Goal): MouseEventHandler<HTMLAnchorElement> =>
            (e) => {
                if (e.metaKey || e.ctrlKey) return;

                e.preventDefault();
                setPreview(goal);
            },
        [],
    );

    const onGoalPreviewClose = useCallback(() => {
        setPreview(null);
    }, []);

    return (
        <Page
            user={user}
            locale={locale}
            ssrTime={ssrTime}
            title={t.rich('goals.title', {
                team: () => team.title,
            })}
        >
            <TeamPageLayout actions team={team}>
                <FiltersPanel
                    count={goalsCount}
                    flowId={projects[0]?.flowId}
                    users={usersFilterData}
                    tags={tagsFilterData}
                    stateFilter={stateFilter}
                    tagsFilter={tagsFilter}
                    ownerFilter={ownerFilter}
                    searchFilter={fulltextFilter}
                    limitFilter={limitFilter}
                    onSearchChange={onSearchChange}
                    onStateChange={setStateFilter}
                    onUserChange={setOwnerFilter}
                    onTagChange={setTagsFilter}
                    onLimitChange={setLimitFilter}
                />

                <PageContent>
                    {projects?.map((project) => {
                        return nullable(project.goals?.length, () => (
                            <StyledProjectGroup key={project.key}>
                                <Text size="l" weight="bolder">
                                    {project.title}
                                </Text>

                                <PageSep />

                                <StyledGoalsList>
                                    {project.goals?.map((goal) =>
                                        nullable(goal, (g) => (
                                            <GoalListItem
                                                createdAt={g.createdAt}
                                                id={g.id}
                                                state={g.state}
                                                title={g.title}
                                                issuer={g.activity}
                                                owner={g.owner}
                                                tags={g.tags}
                                                comments={g.comments?.length}
                                                key={g.id}
                                                focused={g.id === preview?.id}
                                                onClick={onGoalPrewiewShow(g)}
                                            />
                                        )),
                                    )}
                                </StyledGoalsList>
                            </StyledProjectGroup>
                        ));
                    })}
                </PageContent>

                {nullable(preview, (p) => (
                    <GoalPreview goal={p} visible={Boolean(p)} onClose={onGoalPreviewClose} />
                ))}
            </TeamPageLayout>
        </Page>
    );
};

export default TeamGoalsPage;
