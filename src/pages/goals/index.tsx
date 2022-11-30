import React, { MouseEventHandler, useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { Goal, Project } from '../../../graphql/@generated/genql';
import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { Page, PageContent } from '../../components/Page';
import { GoalListItem } from '../../components/GoalListItem';
import { nullable } from '../../utils/nullable';
import { CommonHeader } from '../../components/CommonHeader';
import { FiltersPanel } from '../../components/FiltersPanel';
import { useMounted } from '../../hooks/useMounted';
import { useUrlParams } from '../../hooks/useUrlParams';
import { Text } from '../../components/Text';
import { PageSep } from '../../components/PageSep';
import { Button } from '../../components/Button';
import { defaultLimit } from '../../components/LimitFilterDropdown';

const GoalPreview = dynamic(() => import('../../components/GoalPreview'));

const refreshInterval = 3000;
const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

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
    async ({ user, query }) => {
        return {
            ssrData: await fetcher(
                user,
                parseQueryParam(query.state as string),
                parseQueryParam(query.search as string).toString(),
                parseQueryParam(query.tags as string),
                parseQueryParam(query.user as string),
                Number(parseQueryParam(query.limit as string)),
            ),
        };
    },
    {
        private: true,
    },
);

const GoalsPage = ({ user, ssrTime, locale, ssrData }: ExternalPageProps<{ userGoals: Project[] }>) => {
    const t = useTranslations('goals.index');
    const mounted = useMounted(refreshInterval);
    const router = useRouter();

    const [stateFilter, setStateFilter] = useState<string[]>(parseQueryParam(router.query.state as string));
    const [tagsFilter, setTagsFilter] = useState<string[]>(parseQueryParam(router.query.tags as string));
    const [ownerFilter, setOwnerFilter] = useState<string[]>(parseQueryParam(router.query.user as string));
    const [fulltextFilter, setFulltextFilter] = useState(parseQueryParam(router.query.search as string).toString());
    const [limitFilter, setLimitFilter] = useState(Number(router.query.limit) || defaultLimit);

    const [preview, setPreview] = useState<Goal | null>(null);

    const { data } = useSWR(
        mounted ? [user, stateFilter, fulltextFilter, tagsFilter, ownerFilter, limitFilter] : null,
        (...args) => fetcher(...args),
        {
            refreshInterval,
        },
    );

    const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFulltextFilter(e.currentTarget.value);
    }, []);

    // NB: this line is compensation for first render before delayed swr will bring updates
    const projects: Project[] = data?.userGoals ?? ssrData.userGoals;

    const [projectsFilterData, usersFilterData, tagsFilterData, goalsCount] = useMemo(() => {
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
            Array.from(projectsData.values()),
            Array.from(usersData.values()),
            Array.from(tagsData.values()),
            goalsCount,
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
        <Page user={user} ssrTime={ssrTime} locale={locale} title={t('title')}>
            <CommonHeader title={t('Dashboard')} description={t('This is your personal goals bundle')}></CommonHeader>

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
            >
                <Button
                    view="primary"
                    size="m"
                    text={t('New goal')}
                    onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}
                />
            </FiltersPanel>

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
                                            locale={locale}
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
                <GoalPreview locale={locale} goal={p} visible={Boolean(p)} onClose={onGoalPreviewClose} />
            ))}
        </Page>
    );
};

export default GoalsPage;
