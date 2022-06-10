/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useState } from 'react';
import useSWR from 'swr';
import styled, { css } from 'styled-components';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { Goal, EstimateInput, GoalInput, UserAnyKind } from '../../../graphql/@generated/genql';
import { gql } from '../../utils/gql';
import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { estimatedMeta } from '../../utils/dateTime';
import { nullable } from '../../utils/nullable';
import { useMounted } from '../../hooks/useMounted';
import { Page, PageContent } from '../../components/Page';
import { Tag } from '../../components/Tag';
import { PageSep } from '../../components/PageSep';
import { State } from '../../components/State';
import { Link } from '../../components/Link';
import { Card, CardInfo, CardContent, CardActions } from '../../components/Card';
import { IssueTitle } from '../../components/IssueTitle';
import { IssueKey } from '../../components/IssueKey';
import { IssueStats } from '../../components/IssueStats';
import { RelativeTime } from '../../components/RelativeTime';
import { Md } from '../../components/Md';
import { UserCompletion } from '../../components/UserCompletion';
import { EstimateDropdown } from '../../components/EstimateDropdown';
import { UserPic } from '../../components/UserPic';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { gapS } from '../../design/@generated/themes';

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
            watchers: {
                id: true,
            },
            stargizers: {
                id: true,
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

const StyledIssueInfo = styled.div<{ align: 'left' | 'right' }>`
    ${({ align }) => css`
        justify-self: ${align};
    `}
`;

const ActionButton = styled(Button)`
    margin-right: ${gapS};
`;

const IssueAction = styled.div`
    margin-right: ${gapS};
`;

const StyledIssueTags = styled.span`
    padding-left: 12px;
`;

const IssueTags: React.FC<{ tags: Goal['tags'] }> = ({ tags }) => (
    <StyledIssueTags>
        {tags?.map((tag) => nullable(tag, (t) => <Tag key={t.id} title={t.title} description={t.description} />))}
    </StyledIssueTags>
);

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { id } }) => ({
        ssrData: await fetcher(user, id),
    }),
    {
        private: true,
    },
);

const GoalPage = ({ user, locale, ssrData, params: { id } }: ExternalPageProps<{ goal: Goal }, { id: string }>) => {
    const t = useTranslations('goals.id');
    const mounted = useMounted(refreshInterval);

    const { data } = useSWR(mounted ? [user, id] : null, (...args) => fetcher(...args), {
        refreshInterval,
    });

    // this line is compensation for first render before delayed swr will bring updates
    const goal = data?.goal ?? ssrData.goal;

    const isUserAllowedToEdit = user?.id === goal?.computedIssuer?.id || user?.id === goal?.computedOwner?.id;
    // @ts-ignore unexpectable trouble with filter
    const [watcher, setWatcher] = useState(goal.watchers?.filter(({ id }) => id === user.activityId).length > 0);
    const [stargizer, setStargizer] = useState(
        // @ts-ignore unexpectable trouble with filter
        goal.stargizers?.filter(({ id }) => id === user.activityId).length > 0,
    );

    const triggerUpdate = useCallback(
        (input: GoalInput) => {
            const promise = gql.mutation({
                updateGoal: [
                    {
                        user: user!,
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

    const [issueEstimate, setIssueEstimate] = useState<EstimateInput | undefined>(
        goal.estimate?.length ? goal.estimate[goal.estimate.length - 1] : undefined,
    );
    const onIssueEstimateChange = useCallback(
        async (estimate?: EstimateInput) => {
            setIssueEstimate(estimate);

            await triggerUpdate({
                id: goal.id,
                estimate,
            });
        },
        [triggerUpdate, goal],
    );

    const onWatchToggle = useCallback(async () => {
        setWatcher((w) => !w);

        await triggerUpdate({
            id: goal.id,
            watch: !watcher,
        });
    }, [triggerUpdate, goal, watcher]);

    const onStarToggle = useCallback(async () => {
        setStargizer((s) => !s);

        await triggerUpdate({
            id: goal.id,
            star: !stargizer,
        });
    }, [triggerUpdate, goal, stargizer]);

    return (
        <Page locale={locale} title={goal.title}>
            <IssueHeader>
                <StyledIssueInfo align="left">
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

                <StyledIssueInfo align="right">
                    <ActionButton
                        text={t(watcher ? 'Unwatch' : 'Watch')}
                        iconLeft={<Icon type={watcher ? 'eye' : 'eyeClosed'} size="s" />}
                        onClick={onWatchToggle}
                    />
                    <ActionButton
                        text={t(stargizer ? 'Unstar' : 'Star')}
                        iconLeft={<Icon type={stargizer ? 'starFilled' : 'star'} size="s" />}
                        onClick={onStarToggle}
                    />
                </StyledIssueInfo>
            </IssueHeader>

            <PageSep />

            <IssueContent>
                <Card>
                    <CardInfo>
                        <Link inline>{goal.computedIssuer!.name}</Link> <RelativeTime date={goal.createdAt} />
                    </CardInfo>

                    <CardContent>
                        <Md>{goal.description}</Md>
                    </CardContent>

                    <CardActions>
                        <IssueAction>
                            <UserCompletion
                                text={issueOwnerName}
                                placeholder={t('Set owner')}
                                title={t('Set owner')}
                                query={issueOwnerName}
                                userPic={<UserPic src={issueOwner?.image} size={16} />}
                                onClick={isUserAllowedToEdit ? onIssueOwnerChange : undefined}
                            />
                        </IssueAction>

                        <IssueAction>
                            <EstimateDropdown
                                size="m"
                                text={t('Schedule')}
                                placeholder={t('Date input mask placeholder')}
                                mask={t('Date input mask')}
                                value={issueEstimate}
                                defaultValuePlaceholder={issueEstimate ?? estimatedMeta()}
                                onClose={isUserAllowedToEdit ? onIssueEstimateChange : undefined}
                            />
                        </IssueAction>
                    </CardActions>
                </Card>
            </IssueContent>

            <PageContent>
                <pre>{JSON.stringify(goal, null, 2)}</pre>
            </PageContent>
        </Page>
    );
};

export default GoalPage;
