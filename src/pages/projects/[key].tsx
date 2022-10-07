import useSWRInfinite from 'swr/infinite';
import styled, { css } from 'styled-components';
import { useTranslations } from 'next-intl';

import { createFetcher } from '../../utils/createFetcher';
import { Goal, Project } from '../../../graphql/@generated/genql';
import { Page, PageContent } from '../../components/Page';
import { Button } from '../../components/Button';
import { GoalItem } from '../../components/GoalItem';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { nullable } from '../../utils/nullable';
import { Text } from '../../components/Text';
import { Input } from '../../components/Input';
import { gapM, gapS, gray4, gray5, gray6, gray7, gray9, radiusXl, textColor } from '../../design/@generated/themes';

const PAGE_SIZE = 5;

// @ts-ignore
const fetcher = createFetcher((_, key: string, offset = 0) => ({
    project: [
        {
            key,
        },
        {
            id: true,
            key: true,
            title: true,
            description: true,
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
            key,
            offset,
            pageSize: PAGE_SIZE,
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
}));

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

const ProjectHeader = styled(PageContent)`
    display: grid;
    grid-template-columns: 8fr 4fr;
`;

const StyledProjectTitle = styled.div`
    padding-top: ${gapM};
`;

const StyledProjectInfo = styled.div<{ align: 'left' | 'right' }>`
    ${({ align }) => css`
        justify-self: ${align};
    `}

    ${({ align }) =>
        align === 'right' &&
        css`
            display: grid;
            justify-items: end;
            align-content: space-between;
        `}
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

const StyledProjectMenu = styled.div`
    padding: ${gapM} 0 0;

    margin-left: -6px; // radius compensation
`;

const StyledProjectMenuItem = styled.div<{ active?: boolean }>`
    display: inline-block;
    padding: ${gapS} ${gapM};

    border-radius: ${radiusXl};

    color: ${gray7};

    ${({ active }) =>
        active &&
        css`
            font-weight: 600;
            color: ${textColor};

            background-color: ${gray4};
        `}
`;

const StyledFiltersMenu = styled.div`
    padding-left: ${gapM};
`;

const StyledFiltersMenuItem = styled.div<{ active?: boolean }>`
    display: inline-block;
    padding: ${gapS};

    border-radius: ${radiusXl};

    font-weight: 600;

    color: ${gray9};

    ${({ active }) =>
        active &&
        css`
            color: ${textColor};
        `}
`;

const ProjectPage = ({
    user,
    locale,
    ssrData,
    params: { key },
}: ExternalPageProps<{ project: Project; projectGoals: Goal[] }, { key: string }>) => {
    const t = useTranslations('projects.key');

    const { data, setSize, size } = useSWRInfinite(
        (index: number) => ({ offset: index * PAGE_SIZE }),
        ({ offset }) => fetcher(user, key, offset),
    );

    const shouldRenderMoreButton = data?.[data.length - 1]?.projectGoals?.length === PAGE_SIZE;

    // FIXME: https://github.com/taskany-inc/issues/issues/107
    const goals = data?.map((chunk) => chunk.projectGoals).flat() ?? ssrData.projectGoals;
    const project = data?.[0].project ?? ssrData.project;

    return (
        <Page
            locale={locale}
            title={t.rich('title', {
                project: () => project.title,
            })}
        >
            <ProjectHeader>
                <StyledProjectInfo align="left">
                    <Text size="m" weight="bold" color={gray6}>
                        {t('key')}: {project.key}
                    </Text>

                    <StyledProjectTitle>
                        <Text size="xxl" weight="bolder">
                            {project.title}
                        </Text>
                    </StyledProjectTitle>

                    <StyledProjectMenu>
                        <StyledProjectMenuItem active>Goals</StyledProjectMenuItem>
                        <StyledProjectMenuItem>Issues</StyledProjectMenuItem>
                        <StyledProjectMenuItem>Boards</StyledProjectMenuItem>
                        <StyledProjectMenuItem>Wiki</StyledProjectMenuItem>
                        <StyledProjectMenuItem>Settings</StyledProjectMenuItem>
                    </StyledProjectMenu>
                </StyledProjectInfo>
            </ProjectHeader>

            <StyledFiltersPanel>
                <StyledFiltersContent>
                    <Input placeholder="Search" />

                    <StyledFiltersMenu>
                        <StyledFiltersMenuItem>State</StyledFiltersMenuItem>
                        <StyledFiltersMenuItem active>Owner</StyledFiltersMenuItem>
                        <StyledFiltersMenuItem>Tags</StyledFiltersMenuItem>
                        <StyledFiltersMenuItem active>Sort</StyledFiltersMenuItem>
                    </StyledFiltersMenu>

                    <div style={{ textAlign: 'right' }}>
                        <Button view="primary" size="m" text="New goal" />
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
