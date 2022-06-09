/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useState } from 'react';
import useSWR, { unstable_serialize } from 'swr';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { gql } from '../../utils/gql';
import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { declarePage } from '../../utils/declarePage';
import { estimatedMeta } from '../../utils/dateTime';
import { nullable } from '../../utils/nullable';
import { Goal, GoalEstimate, GoalInput, UserAnyKind } from '../../../graphql/@generated/genql';
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
import { EstimateDropdown } from '../../components/EstimateDropdown';
import { UserPic } from '../../components/UserPic';
import { useMounted } from '../../hooks/useMounted';

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
            estimate: {
                date: true,
                q: true,
                y: true,
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
        {tags?.map((tag) => nullable(tag, (t) => <Tag key={t.id} title={t.title} description={t.description} />))}
    </StyledIssueTags>
);

export const getServerSideProps = declareSsrProps(async ({ user, params: { id } }) => ({
    ssrData: await fetcher(user, id),
}));

export default declarePage<{ goal: Goal }, { id: string }>(
    ({ user, locale, ssrData, params: { id } }) => {
        const t = useTranslations('goals.id');
        const mounted = useMounted(refreshInterval);

        const { data } = useSWR(mounted ? [user, id] : null, (...args) => fetcher(...args), {
            fallback: {
                [unstable_serialize([user, id])]: ssrData,
            },
            refreshInterval,
        });

        // this line is compensation for first render before delayed swr will bring updates
        const goal = data?.goal ?? ssrData.goal;

        const isUserAllowedToEdit = user?.id === goal?.computedIssuer?.id || user?.id === goal?.computedOwner?.id;

        const triggerUpdate = useCallback(
            (input: GoalInput) => {
                const promise = gql.mutation({
                    updateGoal: [
                        {
                            user,
                            data: input,
                        },
                        {
                            id: true,
                        },
                    ],
                });

                toast.promise(promise, {
                    error: t('Something went wrong 😿'),
                    loading: t('We are updating the goal'),
                    success: t('Voila! Goal is up to date 🎉'),
                });

                return promise;
            },
            [user, t],
        );

        const [issueOwner, setIssueOwner] = useState(goal.computedOwner);
        const issueOwnerName = issueOwner?.name || issueOwner?.email;
        const onIssueOwnerChange = useCallback(
            async (owner: UserAnyKind) => {
                setIssueOwner(owner);

                await triggerUpdate({
                    id: goal.id,
                    ownerId: owner.activity?.id,
                });
            },
            [triggerUpdate, goal],
        );

        const [issueEstimate, setIssueEstimate] = useState<GoalEstimate | undefined>(
            goal.estimate?.length ? goal.estimate[goal.estimate.length - 1] : undefined,
        );
        const onIssueEstimateChange = useCallback(
            async (estimate?: GoalEstimate) => {
                setIssueEstimate(estimate);

                await triggerUpdate({
                    id: goal.id,
                    estimate,
                });
            },
            [triggerUpdate, goal],
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
                            state={nullable(goal.state, (s) => (
                                <State title={s.title} hue={s.hue} />
                            ))}
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

                            <EstimateDropdown
                                size="m"
                                text={t('Schedule')}
                                placeholder={t('Date input mask placeholder')}
                                mask={t('Date input mask')}
                                value={issueEstimate}
                                defaultValuePlaceholder={issueEstimate ?? estimatedMeta()}
                                onClose={isUserAllowedToEdit ? onIssueEstimateChange : undefined}
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
