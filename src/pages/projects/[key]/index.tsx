import { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import { createFetcher } from '../../../utils/createFetcher';
import { Goal, Project } from '../../../../graphql/@generated/genql';
import { Button } from '../../../components/Button';
import { GoalListItem } from '../../../components/GoalListItem';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { nullable } from '../../../utils/nullable';
import { FiltersPanel } from '../../../components/FiltersPanel';
import { defaultLimit } from '../../../components/LimitFilterDropdown';
import { useUrlParams } from '../../../hooks/useUrlParams';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useWillUnmount } from '../../../hooks/useWillUnmount';
import { ProjectPageLayout } from '../../../components/ProjectPageLayout';
import { Page } from '../../../components/Page';

const GoalPreview = dynamic(() => import('../../../components/GoalPreview'));

const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

const fetcher = createFetcher(
    (_, key: string, offset = 0, states = [], query = '', limitFilter = defaultLimit, tags = [], owner = []) => ({
        project: [
            {
                key,
            },
            {
                id: true,
                key: true,
                title: true,
                description: true,
                activityId: true,
                flowId: true,
                flow: {
                    id: true,
                },
                teams: {
                    slug: true,
                    title: true,
                    description: true,
                    _count: {
                        projects: true,
                    },
                },
                tags: {
                    id: true,
                    title: true,
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
                _count: {
                    stargizers: true,
                },
                _isStarred: true,
                _isWatching: true,
            },
        ],
        projectGoals: [
            {
                data: {
                    key,
                    offset,
                    pageSize: limitFilter,
                    states,
                    tags,
                    owner,
                    query,
                },
            },
            {
                id: true,
                title: true,
                description: true,
                project: {
                    id: true,
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
        ],
        projectGoalsCount: [
            {
                data: {
                    key,
                    states,
                    tags,
                    owner,
                    query,
                },
            },
        ],
    }),
);

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { key }, query }) => {
        const ssrProps = {
            ssrData: await fetcher(
                user,
                key,
                0,
                parseQueryParam(query.state as string),
                parseQueryParam(query.search as string).toString(),
                Number(parseQueryParam(query.limit as string)),
                parseQueryParam(query.user as string),
                parseQueryParam(query.tags as string),
            ),
        };

        if (!ssrProps.ssrData.project) {
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

const StyledGoalsList = styled.div`
    padding: 20px 20px 0 20px;
`;

const StyledLoadMore = styled.div`
    margin: 50px 40px;
`;

const ProjectPage = ({
    user,
    locale,
    ssrTime,
    ssrData,
    params: { key },
}: ExternalPageProps<{ project: Project; projectGoals: Goal[]; projectGoalsCount: number }, { key: string }>) => {
    const t = useTranslations('projects');
    const router = useRouter();

    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);

    const [stateFilter, setStateFilter] = useState<string[]>(parseQueryParam(router.query.state as string));
    const [tagsFilter, setTagsFilter] = useState<string[]>(parseQueryParam(router.query.tags as string));
    const [ownerFilter, setOwnerFilter] = useState<string[]>(parseQueryParam(router.query.user as string));
    const [fulltextFilter, setFulltextFilter] = useState(parseQueryParam(router.query.search as string).toString());
    const [limitFilter, setLimitFilter] = useState(Number(router.query.limit) || defaultLimit);

    const [preview, setPreview] = useState<Goal | null>(null);

    const { data, setSize, size } = useSWRInfinite(
        (index: number) => ({
            offset: index * limitFilter,
            stateFilter,
            fulltextFilter,
            limitFilter,
            tagsFilter,
            ownerFilter,
        }),
        ({ offset, stateFilter, fulltextFilter, limitFilter, tagsFilter, ownerFilter }) =>
            fetcher(user, key, offset, stateFilter, fulltextFilter, limitFilter, tagsFilter, ownerFilter),
    );

    const shouldRenderMoreButton =
        data?.[data.length - 1]?.projectGoals?.length === limitFilter &&
        (data?.[data.length - 1]?.projectGoals?.length || 0) * size < (data?.[0].projectGoalsCount || 0);

    const goals = fulltextFilter
        ? data?.map((chunk) => chunk.projectGoals).flat()
        : data?.map((chunk) => chunk.projectGoals).flat() ?? ssrData.projectGoals;
    const project = data?.[0].project ?? ssrData.project;
    const goalsCount = data?.[0].projectGoalsCount ?? ssrData.projectGoalsCount;

    useEffect(() => {
        setCurrentProjectCache({
            id: project.id,
            title: project.title,
            description: project.description,
            flowId: project.flowId,
            kind: 'project',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFulltextFilter(e.currentTarget.value);
    }, []);

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
            title={t.rich('index.title', {
                project: () => project.title,
            })}
        >
            <ProjectPageLayout actions project={project}>
                <FiltersPanel
                    count={goalsCount}
                    flowId={project.flow?.id}
                    users={project.participants}
                    tags={project.tags}
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

                <StyledGoalsList>
                    {goals?.map((goal) =>
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
                                onClick={onGoalPrewiewShow(g)}
                            />
                        )),
                    )}

                    <StyledLoadMore>
                        {shouldRenderMoreButton && (
                            <Button text={t('index.Load more')} onClick={() => setSize(size + 1)} />
                        )}
                    </StyledLoadMore>
                </StyledGoalsList>

                {nullable(preview, (p) => (
                    <GoalPreview goal={p} visible={Boolean(p)} onClose={onGoalPreviewClose} />
                ))}
            </ProjectPageLayout>
        </Page>
    );
};

export default ProjectPage;
