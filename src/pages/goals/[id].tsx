/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useEffect, useState } from 'react';
import useSWR, { unstable_serialize } from 'swr';
import styled from 'styled-components';

import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { declarePage } from '../../utils/declarePage';
import { Goal } from '../../../graphql/@generated/genql';
import { Page, PageContent } from '../../components/Page';
import { Tag } from '../../components/Tag';
import { PageSep } from '../../components/PageSep';
import { State } from '../../components/State';
import { Link } from '../../components/Link';
import { Card } from '../../components/Card';
import { IssueTitle } from '../../components/IssueTitle';
import { IssueKey } from '../../components/IssueKey';
import { IssueStats } from '../../components/IssueStats';
import { RelativeTime } from '../../components/RelativeTime';

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
                hue: true,
            },
            createdAt: true,
            updatedAt: true,
            project: {
                key: true,
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
            },
        },
    ],
}));

const IssueHeader = styled(PageContent)`
    display: grid;
    grid-template-columns: 8fr 4fr;
`;

const IssueContent = styled(PageContent)`
    display: grid;
    grid-template-columns: 7fr 5fr;
`;

const StyledIssueInfo = styled.div``;

const StyledIssueTags = styled.span`
    padding-left: 12px;
`;

const IssueTags: React.FC<{ tags: Goal['tags'] }> = ({ tags }) => (
    <StyledIssueTags>
        {tags?.map((t) => (t ? <Tag key={t.id} title={t.title} description={t.description} /> : null))}
    </StyledIssueTags>
);

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

        const issuedBy = (
            <>
                Issued by <Link inline>{goal.computedIssuer!.name}</Link>
                {' — '}
                <RelativeTime date={goal.createdAt} />
            </>
        );

        return (
            <Page locale={locale} title={goal.title}>
                <IssueHeader>
                    <StyledIssueInfo>
                        <IssueKey id={goal.id}>
                            <IssueTags tags={goal.tags} />
                        </IssueKey>

                        <IssueTitle title={goal.title} project={goal.project} />

                        <IssueStats
                            state={goal.state ? <State title={goal.state.title} hue={goal.state.hue} /> : null}
                            comments={0}
                            updatedAt={goal.updatedAt}
                        />
                    </StyledIssueInfo>
                </IssueHeader>

                <PageSep />

                <IssueContent>
                    <Card info={issuedBy}>{goal.description}</Card>
                </IssueContent>

                <PageContent>
                    <pre>{JSON.stringify(goal, null, 2)}</pre>
                </PageContent>
            </Page>
        );
    },
    { private: true },
);
