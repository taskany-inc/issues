/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useCallback, useEffect, useState } from 'react';
import useSWR, { unstable_serialize } from 'swr';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { gql } from '../../utils/gql';
import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { declarePage } from '../../utils/declarePage';
import { Goal, UserAnyKind } from '../../../graphql/@generated/genql';
import { Page, PageContent } from '../../components/Page';
import { Tag } from '../../components/Tag';
import { PageSep } from '../../components/PageSep';
import { State } from '../../components/State';
import { Link } from '../../components/Link';
import { Card, CardActions } from '../../components/Card';
import { IssueTitle } from '../../components/IssueTitle';
import { IssueKey } from '../../components/IssueKey';
import { IssueStats } from '../../components/IssueStats';
import { RelativeTime } from '../../components/RelativeTime';
import { Md } from '../../components/Md';
import { UserCompletion } from '../../components/UserCompletion';
import { UserPic } from '../../components/UserPic';

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
                image: true,
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
        const t = useTranslations('goals.id');
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
        const isUserAllowedToEdit = user?.id === goal?.computedIssuer?.id || user?.id === goal?.computedOwner?.id;

        const [issueOwner, setIssueOwner] = useState(goal.computedOwner);
        const issueOwnerName = issueOwner?.name || issueOwner?.email;
        const onIssueOwnerChange = useCallback(
            async (owner: UserAnyKind) => {
                setIssueOwner(owner);

                const promise = gql.mutation({
                    updateGoal: [
                        {
                            user,
                            data: {
                                id: goal.id,
                                ownerId: owner.activity?.id,
                            },
                        },
                        {
                            id: true,
                        },
                    ],
                });

                toast.promise(promise, {
                    error: t('Something went wrong 😿'),
                    loading: t('We are updating new goal'),
                    success: t('Voila! Goal is up to date 🎉'),
                });

                await promise;
            },
            [goal, t, user],
        );

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
                    <Card info={issuedBy}>
                        <Md>{goal.description}</Md>

                        <CardActions>
                            <UserCompletion
                                text={issueOwnerName}
                                placeholder={t('Set owner')}
                                title={t('Set owner')}
                                query={issueOwnerName}
                                userPic={<UserPic src={issueOwner?.image} size={16} />}
                                onClick={isUserAllowedToEdit ? onIssueOwnerChange : undefined}
                            />
                        </CardActions>
                    </Card>
                </IssueContent>

                <PageContent>
                    <pre>{JSON.stringify(goal, null, 2)}</pre>
                </PageContent>
            </Page>
        );
    },
    { private: true },
);
