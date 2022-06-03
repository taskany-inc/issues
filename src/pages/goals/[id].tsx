import { useEffect, useState } from 'react';
import useSWR, { unstable_serialize } from 'swr';
import styled from 'styled-components';
import { Grid } from '@geist-ui/core';

import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { declarePage } from '../../utils/declarePage';
import { dateAgo, currentDate } from '../../utils/dateTime';
import { cardBorderColor } from '../../design/@generated/themes';
import { Goal } from '../../../graphql/@generated/genql';
import { Page, PageContent } from '../../components/Page';
import { IssueHeader } from '../../components/IssueHeader';
import { Tag } from '../../components/Tag';
import { PageSep } from '../../components/PageSep';

const refreshInterval = 3000;

const fetcher = createFetcher((_, id: string) => ({
    goal: [
        {
            id,
        },
        {
            id: true,
            title: true,
            description: true,
            state: {
                title: true,
                color: true,
            },
            createdAt: true,
            updatedAt: true,
            project: {
                slug: true,
                title: true,
                description: true,
            },
            computedIssuer: {
                id: true,
                name: true,
                email: true,
            },
            computedOwner: {
                id: true,
                name: true,
                email: true,
            },
            tags: {
                id: true,
                title: true,
                description: true,
                color: true,
            },
        },
    ],
}));

const StyledCard = styled.div`
    position: relative;
    overflow: hidden;
    border: 1px solid ${cardBorderColor};
    border-radius: 6px;
    min-height: 180px;
`;

const StyledCardContent = styled.div`
    padding: 12px 20px;
`;
const StyledCardInfo = styled.div`
    padding: 4px 20px;
    background-color: ${cardBorderColor};
    color: rgba(255, 255, 255, 0.4);
    font-size: 13px;
`;

export const getServerSideProps = declareSsrProps(async ({ user, params: { id } }) => ({
    ssrData: await fetcher(user, id),
}));

export default declarePage<{ goal: Goal }, { id: string }>(
    ({ user, locale, ssrData, params: { id } }) => {
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            const lazySubsTimer = setTimeout(() => setMounted(true), refreshInterval);

            return () => clearInterval(lazySubsTimer);
        }, []);

        const { data } = useSWR(mounted ? [user, id] : null, (...args) => fetcher(...args), {
            fallback: {
                [unstable_serialize([user, id])]: ssrData,
            },
            refreshInterval,
        });

        const goal = data?.goal ?? ssrData.goal;

        return (
            <Page locale={locale} title={goal.title}>
                <PageContent>
                    <IssueHeader
                        issue={goal}
                        extras={
                            <>
                                <Tag title={goal.state.title} color={goal.state.color} /> • updated{' '}
                                <span title={currentDate(new Date(goal.updatedAt))}>{dateAgo(goal.updatedAt)}</span> • 0
                                comments
                                <div>
                                    {goal.tags?.map((t) => (
                                        <Tag key={t.id} title={t.title} description={t.description} color={t.color} />
                                    ))}
                                </div>
                            </>
                        }
                    />
                </PageContent>

                <PageSep />

                <PageContent>
                    <Grid.Container>
                        <Grid xs={16}>
                            <div className="flexRestore" style={{ width: '100%' }}>
                                <StyledCard>
                                    <StyledCardInfo>
                                        Issued by {goal.computedIssuer.name}{' '}
                                        <span title={currentDate(new Date(goal.createdAt))}>
                                            {dateAgo(goal.createdAt)}
                                        </span>
                                    </StyledCardInfo>
                                    <StyledCardContent>{goal.description}</StyledCardContent>
                                </StyledCard>
                            </div>
                        </Grid>
                        <Grid xs={8}></Grid>
                    </Grid.Container>
                </PageContent>

                <PageContent>
                    <pre>{JSON.stringify(goal, null, 2)}</pre>
                </PageContent>
            </Page>
        );
    },
    { private: true },
);
