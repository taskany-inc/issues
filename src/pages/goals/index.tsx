import React, { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';

import { Project } from '../../../graphql/@generated/genql';
import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { Page, PageContent } from '../../components/Page';
import { GoalItem } from '../../components/GoalItem';
import { nullable } from '../../utils/nullable';
import { CommonHeader } from '../../components/CommonHeader';
import { FiltersPanel } from '../../components/FiltersPanel';
import { useMounted } from '../../hooks/useMounted';
import { Text } from '../../components/Text';
import { PageSep } from '../../components/PageSep';

const refreshInterval = 3000;

const fetcher = createFetcher((_, states = [], query = '', tags = [], owner = []) => ({
    userGoals: [
        {
            data: {
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
                state: {
                    id: true,
                    title: true,
                    hue: true,
                },
                activity: {
                    user: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                owner: {
                    user: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
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
    async ({ user, query }) => {
        // TODO: parse query to filters
        return {
            ssrData: await fetcher(user, [], '', [], []),
        };
    },
    {
        private: true,
    },
);

const GoalsPage = ({ user, locale, ssrData }: ExternalPageProps<{ userGoals: Project[] }>) => {
    const t = useTranslations('goals.index');
    const mounted = useMounted(refreshInterval);
    const [fulltextFilter, setFulltextFilter] = useState('');
    const [stateFilter, setStateFilter] = useState<string[]>();
    const [tagsFilter, setTagsFilter] = useState<string[]>();
    const [ownerFilter, setOwnerFilter] = useState<string[]>();

    const { data } = useSWR(
        mounted ? [user, stateFilter, fulltextFilter, tagsFilter, ownerFilter] : null,
        (...args) => fetcher(...args),
        {
            refreshInterval,
        },
    );

    // NB: this line is compensation for first render before delayed swr will bring updates
    const projects: Project[] = data?.userGoals ?? ssrData.userGoals;

    const [projectsFilterData, usersFilterData, tagsFilterData, goalsCount] = useMemo(() => {
        const projectsData = new Map();
        const tagsData = new Map();
        const usersData = new Map();
        let goalsCount = 0;
        // useMemo
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
            Array.from(projectsData.values()),
            Array.from(usersData.values()),
            Array.from(tagsData.values()),
            goalsCount,
        ];
    }, [projects]);

    const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFulltextFilter(e.currentTarget.value);
    }, []);

    return (
        <Page locale={locale} title={t('title')}>
            <CommonHeader title={t('Dashboard')} description={t('This is your personal goals bundle')}></CommonHeader>

            <FiltersPanel
                count={goalsCount}
                flowId={projects[0].flowId}
                users={usersFilterData}
                tags={tagsFilterData}
                onSearchChange={onSearchChange}
                onStateChange={setStateFilter}
                onUserChange={setOwnerFilter}
                onTagChange={setTagsFilter}
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
                                        <GoalItem
                                            createdAt={g.createdAt}
                                            id={g.id}
                                            state={g.state}
                                            title={g.title}
                                            issuer={g.activity?.user}
                                            owner={g.owner?.user}
                                            tags={g.tags}
                                            comments={g.comments?.length}
                                            key={g.id}
                                        />
                                    )),
                                )}
                            </StyledGoalsList>
                        </StyledProjectGroup>
                    ));
                })}
            </PageContent>
        </Page>
    );
};

export default GoalsPage;
