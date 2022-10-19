import { useCallback, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';

import { routes } from '../../../hooks/router';
import { createFetcher } from '../../../utils/createFetcher';
import { Goal, Project } from '../../../../graphql/@generated/genql';
import { Page, PageContent } from '../../../components/Page';
import { Button } from '../../../components/Button';
import { GoalItem } from '../../../components/GoalItem';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { nullable } from '../../../utils/nullable';
import { Input } from '../../../components/Input';
import { gapM, gapS, gray5 } from '../../../design/@generated/themes';
import { StateFilter } from '../../../components/StateFilter';
import { TagsFilter } from '../../../components/TagsFilter';
import { defaultLimit, LimitFilter } from '../../../components/LimitFilter';
import { CommonHeader } from '../../../components/CommonHeader';
import { TabsMenu, TabsMenuItem } from '../../../components/TabsMenu';
import { dispatchModalEvent, ModalEvent } from '../../../utils/dispatchModal';
import { ProjectWatchButton } from '../../../components/ProjectWatchButton';
import { ProjectStarButton } from '../../../components/ProjectStarButton';
import { Badge } from '../../../components/Badge';
import { UserFilter } from '../../../components/UserFilter';

// @ts-ignore
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
                flow: {
                    id: true,
                },
                watchers: {
                    id: true,
                },
                stargizers: {
                    id: true,
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
                computedActivity: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
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
                computedActivity: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
                computedOwner: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
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
    async ({ user, params: { key } }) => ({
        ssrData: await fetcher(user, key),
    }),
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

const StyledFiltersPanel = styled.div`
    margin: ${gapM} 0;
    padding: ${gapS} 0;

    background-color: ${gray5};
`;

const StyledFiltersContent = styled(PageContent)`
    padding-top: 0;

    display: grid;
    grid-template-columns: 2fr 9fr 1fr;
    align-items: center;
`;

const StyledFiltersMenuWrapper = styled.div`
    display: flex;
    align-items: center;

    padding-left: ${gapS};
`;

const StyledFiltersMenu = styled.div`
    padding-left: ${gapM};
`;

const StyledProjectActions = styled.div`
    justify-self: right;
    justify-items: end;

    align-content: space-between;

    > * + * {
        margin-left: ${gapS};
    }
`;

const ProjectPage = ({
    user,
    locale,
    ssrData,
    params: { key },
}: ExternalPageProps<{ project: Project; projectGoals: Goal[]; projectGoalsCount: number }, { key: string }>) => {
    const t = useTranslations('projects.key');
    const [fulltextFilter, setFulltextFilter] = useState('');
    const [stateFilter, setStateFilter] = useState<string[]>();
    const [tagsFilter, setTagsFilter] = useState<string[]>();
    const [ownerFilter, setOwnerFilter] = useState<string[]>();
    const [limitFilter, setLimitFilter] = useState(defaultLimit);

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

    const shouldRenderMoreButton = data?.[data.length - 1]?.projectGoals?.length === limitFilter;

    // FIXME: https://github.com/taskany-inc/issues/issues/107
    const goals = fulltextFilter
        ? data?.map((chunk) => chunk.projectGoals).flat()
        : data?.map((chunk) => chunk.projectGoals).flat() ?? ssrData.projectGoals;
    const project = data?.[0].project ?? ssrData.project;
    const goalsCount = data?.[0].projectGoalsCount ?? ssrData.projectGoalsCount;

    const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFulltextFilter(e.currentTarget.value);
    }, []);

    return (
        <Page
            locale={locale}
            title={t.rich('title', {
                project: () => project.title,
            })}
        >
            <CommonHeader
                preTitle={`${t('key')}: ${project.key}`}
                title={project.title}
                description={project.description}
            >
                <StyledProjectActions>
                    <ProjectWatchButton
                        activityId={user.activityId}
                        projectId={project.id}
                        watchers={project.watchers}
                    />
                    <ProjectStarButton
                        activityId={user.activityId}
                        projectId={project.id}
                        stargizers={project.stargizers}
                    />
                </StyledProjectActions>

                <TabsMenu>
                    <TabsMenuItem active>Goals</TabsMenuItem>
                    <TabsMenuItem>Issues</TabsMenuItem>
                    <TabsMenuItem>Boards</TabsMenuItem>
                    <TabsMenuItem>Wiki</TabsMenuItem>

                    {nullable(user.activityId === project.activityId, () => (
                        <NextLink href={routes.projectSettings(key)} passHref>
                            <TabsMenuItem>Settings</TabsMenuItem>
                        </NextLink>
                    ))}
                </TabsMenu>
            </CommonHeader>

            <StyledFiltersPanel>
                <StyledFiltersContent>
                    <Input placeholder="Search" onChange={onSearchChange} />

                    <StyledFiltersMenuWrapper>
                        <Badge size="m">{goalsCount}</Badge>

                        <StyledFiltersMenu>
                            <StateFilter text="State" flowId={project.flow?.id} onClick={setStateFilter} />
                            <UserFilter text="Owner" activity={project.participants} onClick={setOwnerFilter} />
                            <TagsFilter tags={project.tags} text="Tags" onClick={setTagsFilter} />
                            <LimitFilter text="Limit" onClick={setLimitFilter} />
                        </StyledFiltersMenu>
                    </StyledFiltersMenuWrapper>

                    <div style={{ textAlign: 'right' }}>
                        <Button
                            view="primary"
                            size="m"
                            text="New goal"
                            onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}
                        />
                    </div>
                </StyledFiltersContent>
            </StyledFiltersPanel>

            <StyledGoalsList>
                {goals?.map((goal) =>
                    nullable(goal, (g) => (
                        <GoalItem
                            createdAt={g.createdAt}
                            id={g.id}
                            state={g.state}
                            title={g.title}
                            issuer={g.computedActivity}
                            owner={g.computedOwner}
                            tags={g.tags}
                            comments={g.comments?.length}
                            key={g.id}
                        />
                    )),
                )}

                <StyledLoadMore>
                    {shouldRenderMoreButton && <Button text={t('Load more')} onClick={() => setSize(size + 1)} />}
                </StyledLoadMore>
            </StyledGoalsList>
        </Page>
    );
};

export default ProjectPage;
