import useSWRInfinite from 'swr/infinite';
import styled, { css } from 'styled-components';

import { createFetcher } from '../../utils/createFetcher';
import { Goal, Project } from '../../../graphql/@generated/genql';
import { Page, PageContent } from '../../components/Page';
import { Button } from '../../components/Button';
import { GoalItem } from '../../components/GoalItem';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { nullable } from '../../utils/nullable';
import { Text } from '../../components/Text';
import { gapM, gray6 } from '../../design/@generated/themes';
import { PageSep } from '../../components/PageSep';

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

const ProjectPage = ({
    user,
    locale,
    ssrData,
    params: { key },
}: ExternalPageProps<{ project: Project; projectGoals: Goal[] }, { key: string }>) => {
    const { data, setSize, size } = useSWRInfinite(
        (index: number) => ({ offset: index * PAGE_SIZE }),
        ({ offset }) => fetcher(user, key, offset),
    );

    const shouldRenderMoreButton = data?.[data.length - 1]?.projectGoals?.length === PAGE_SIZE;

    // FIXME: https://github.com/taskany-inc/issues/issues/107
    const goals = data?.map((chunk) => chunk.projectGoals).flat() ?? ssrData.projectGoals;
    const project = data?.[0].project ?? ssrData.project;

    return (
        <Page locale={locale} title={/* t('title') */ 'test'}>
            <ProjectHeader>
                <StyledProjectInfo align="left">
                    <Text size="m" weight="bold" color={gray6}>
                        {project.key}
                    </Text>

                    <StyledProjectTitle>
                        <Text size="xxl" weight="bolder">
                            {project.title}
                        </Text>
                    </StyledProjectTitle>
                </StyledProjectInfo>
            </ProjectHeader>

            <PageSep />

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
                    {shouldRenderMoreButton && (
                        <Button text={/* t('Load more') */ 'Load'} onClick={() => setSize(size + 1)} />
                    )}
                </StyledLoadMore>
            </StyledGoalsList>
        </Page>
    );
};

export default ProjectPage;
