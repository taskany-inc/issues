/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import styled, { css } from 'styled-components';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { Goal, State, GoalDependencyToggleInput } from '../../../graphql/@generated/genql';
import { gql } from '../../utils/gql';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { formatEstimate } from '../../utils/dateTime';
import { nullable } from '../../utils/nullable';
import { editGoalKeys } from '../../utils/hotkeys';
import { goalFetcher, refreshInterval } from '../../utils/entityFetcher';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { useMounted } from '../../hooks/useMounted';
import { gapM, gapS } from '../../design/@generated/themes';
import { Page, PageContent } from '../../components/Page';
import { PageSep } from '../../components/PageSep';
import { Link } from '../../components/Link';
import { Card, CardInfo, CardContent, CardActions } from '../../components/Card';
import { IssueTitle } from '../../components/IssueTitle';
import { IssueKey } from '../../components/IssueKey';
import { IssueStats } from '../../components/IssueStats';
import { UserPic } from '../../components/UserPic';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Reactions } from '../../components/Reactions';
import { Badge } from '../../components/Badge';
import { CommentView } from '../../components/CommentView';
import { StateDot } from '../../components/StateDot';
import { IssueProject } from '../../components/IssueProject';
import { IssueTags } from '../../components/IssueTags';
import { useHighlightedComment } from '../../hooks/useHighlightedComment';
import { useGoalUpdate } from '../../hooks/useGoalUpdate';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useWillUnmount } from '../../hooks/useWillUnmount';
import { useReactionsProps } from '../../hooks/useReactionsProps';
import { ActivityFeed } from '../../components/ActivityFeed';

const StateSwitch = dynamic(() => import('../../components/StateSwitch'));
const Md = dynamic(() => import('../../components/Md'));
const RelativeTime = dynamic(() => import('../../components/RelativeTime'));
const ModalOnEvent = dynamic(() => import('../../components/ModalOnEvent'));
const GoalEditForm = dynamic(() => import('../../components/GoalEditForm'));
const CommentCreateForm = dynamic(() => import('../../components/CommentCreateForm'));
const ReactionsDropdown = dynamic(() => import('../../components/ReactionsDropdown'));
const IssueDependencies = dynamic(() => import('../../components/IssueDependencies'));
const IssueParticipants = dynamic(() => import('../../components/IssueParticipants'));

const IssueHeader = styled(PageContent)`
    display: grid;
    grid-template-columns: 8fr 4fr;
`;

const IssueContent = styled(PageContent)`
    display: grid;
    grid-template-columns: 7fr 5fr;
    gap: ${gapM};
`;

const StyledIssueInfo = styled.div<{ align: 'left' | 'right' }>`
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

const StyledIssueInfoRow = styled.div``;

const ActionButton = styled(Button)`
    margin-left: ${gapS};
`;

const IssueBaseActions = styled.div`
    display: flex;
    align-items: center;

    & > * {
        margin-right: ${gapS};
    }
`;

const StyledIssueDeps = styled.div``;

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { id } }) => {
        const ssrProps = {
            ssrData: await goalFetcher(user, id),
        };

        if (!ssrProps.ssrData.goal) {
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

const GoalPage = ({
    user,
    locale,
    ssrTime,
    ssrData,
    params: { id },
}: ExternalPageProps<{ goal: Goal; goalPriorityKind: string[]; goalPriorityColors: number[] }, { id: string }>) => {
    const t = useTranslations('goals.id');
    const mounted = useMounted(refreshInterval);
    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);

    const { data, mutate } = useSWR(mounted ? [user, id] : null, (...args) => goalFetcher(...args), {
        refreshInterval,
    });
    const refresh = useCallback(() => mutate(), [mutate]);
    // NB: this line is compensation for first render before delayed swr will bring updates
    const goal: Goal = data?.goal ?? ssrData.goal;

    const issueEstimate = goal.estimate?.length ? goal.estimate[goal.estimate.length - 1] : undefined;
    const isUserAllowedToEdit = user?.activityId === goal?.activityId || user?.activityId === goal?.ownerId;
    const priorityColorIndex = (data || ssrData)?.goalPriorityKind?.indexOf(goal.priority || '') ?? -1;
    const priorityColor =
        priorityColorIndex >= 0 ? (data || ssrData)?.goalPriorityColors?.[priorityColorIndex] : undefined;
    // @ts-ignore unexpectable trouble with filter
    const [watcher, setWatcher] = useState(goal.watchers?.filter(({ id }) => id === user.activityId).length > 0);
    const [stargizer, setStargizer] = useState(
        // @ts-ignore unexpectable trouble with filter
        goal.stargizers?.filter(({ id }) => id === user.activityId).length > 0,
    );
    const [commentFormFocus, setCommentFormFocus] = useState(false);
    const { highlightCommentId, setHighlightCommentId } = useHighlightedComment();
    const updateGoal = useGoalUpdate(t, goal);
    const reactionsProps = useReactionsProps(goal.reactions);

    useEffect(() => {
        goal.project && setCurrentProjectCache(goal.project);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const onGoalStateChange = useCallback(
        async (state: State) => {
            await updateGoal({
                stateId: state.id,
            });

            refresh();
        },
        [updateGoal, refresh],
    );

    const onWatchToggle = useCallback(async () => {
        const promise = gql.mutation({
            toggleGoalWatcher: [
                {
                    toggle: {
                        id: goal.id,
                        direction: !watcher,
                    },
                },
                {
                    id: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are calling owner'),
            success: t(!watcher ? 'Voila! You are watcher now 🎉' : 'So sad! Goal will miss you'),
        });

        setWatcher((w) => !w);

        await promise;
        refresh();
    }, [watcher, goal, refresh, t]);

    const onStarToggle = useCallback(async () => {
        const promise = gql.mutation({
            toggleGoalStargizer: [
                {
                    toggle: {
                        id: goal.id,
                        direction: !stargizer,
                    },
                },
                {
                    id: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are calling owner'),
            success: t(!stargizer ? 'Voila! You are stargizer now 🎉' : 'So sad! Goal will miss you'),
        });

        setStargizer((s) => !s);

        await promise;
        refresh();
    }, [stargizer, goal, refresh, t]);

    const onReactionsToggle = useCallback(
        ({ goalId, commentId }: { goalId?: string; commentId?: string }) =>
            async (emoji?: string) => {
                if (!emoji) return;

                await gql.mutation({
                    toggleReaction: [
                        {
                            data: {
                                emoji,
                                goalId,
                                commentId,
                            },
                        },
                        {
                            id: true,
                        },
                    ],
                });

                refresh();
            },
        [refresh],
    );

    const onParticipantsChange = useCallback(
        async (participants: string[]) => {
            await updateGoal({
                participants,
            });

            refresh();
        },
        [refresh, updateGoal],
    );

    const onDependenciesChange = useCallback(
        async (toggle: GoalDependencyToggleInput) => {
            const promise = gql.mutation({
                toggleGoalDependency: [
                    {
                        toggle,
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

            await promise;

            refresh();
        },
        [refresh, t],
    );

    const onCommentPublish = useCallback(
        (id?: string) => {
            refresh();
            setHighlightCommentId(id);
            setCommentFormFocus(false);
        },
        [refresh, setHighlightCommentId],
    );

    const onCommentLinkClick = useCallback(() => {
        setCommentFormFocus(true);
    }, []);

    const [goalEditModalVisible, setGoalEditModalVisible] = useState(false);
    const onGoalEdit = useCallback(() => {
        setGoalEditModalVisible(false);
        refresh();
    }, [refresh]);

    const onGoalEditModalShow = useCallback(() => {
        setGoalEditModalVisible(true);
    }, []);

    return (
        <Page
            user={user}
            locale={locale}
            ssrTime={ssrTime}
            title={t.rich('title', {
                goal: () => goal.title,
            })}
        >
            <IssueHeader>
                <StyledIssueInfo align="left">
                    <IssueKey id={goal.id}>
                        {nullable(goal.tags, (tags) => (
                            <IssueTags tags={tags} />
                        ))}
                    </IssueKey>

                    {nullable(goal.project, (project) => (
                        <IssueProject project={project} />
                    ))}

                    <IssueTitle title={goal.title} />

                    {nullable(goal.state, (s) => (
                        <StateSwitch state={s} flowId={goal.project?.flowId} onClick={onGoalStateChange} />
                    ))}

                    <IssueStats
                        comments={goal.comments?.length || 0}
                        updatedAt={goal.updatedAt}
                        onCommentsClick={onCommentLinkClick}
                    />
                </StyledIssueInfo>

                <StyledIssueInfo align="right">
                    <StyledIssueInfoRow>
                        <ActionButton
                            text={t(watcher ? 'Watching' : 'Watch')}
                            iconLeft={<Icon noWrap type={watcher ? 'eye' : 'eyeClosed'} size="s" />}
                            onClick={onWatchToggle}
                        />
                        <ActionButton
                            text={t(stargizer ? 'Starred' : 'Stars')}
                            iconLeft={<Icon noWrap type={stargizer ? 'starFilled' : 'star'} size="s" />}
                            iconRight={<Badge>{goal.stargizers?.length}</Badge>}
                            onClick={onStarToggle}
                        />
                    </StyledIssueInfoRow>

                    <StyledIssueInfoRow>
                        <Button
                            view="primary"
                            text={t('New goal')}
                            onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}
                        />
                    </StyledIssueInfoRow>
                </StyledIssueInfo>
            </IssueHeader>

            <PageSep />

            <IssueContent>
                <div>
                    <Card>
                        <CardInfo>
                            <Link inline>{goal.activity?.user?.name}</Link> — <RelativeTime date={goal.createdAt} />
                        </CardInfo>

                        <CardContent>
                            <Md>{goal.description}</Md>
                        </CardContent>

                        <CardActions>
                            <IssueBaseActions>
                                {nullable(goal.priority, (ip) => (
                                    <Button
                                        ghost
                                        text={t(`Priority.${ip}`)}
                                        iconLeft={<StateDot hue={priorityColor} />}
                                    />
                                ))}

                                <Button
                                    ghost
                                    text={goal.owner?.user?.name || goal.owner?.user?.email || goal.owner?.ghost?.email}
                                    iconLeft={
                                        <UserPic
                                            src={goal.owner?.user?.image}
                                            email={goal.owner?.user?.email || goal.owner?.ghost?.email}
                                            size={16}
                                        />
                                    }
                                />

                                {nullable(issueEstimate, (ie) => (
                                    <Button ghost text={formatEstimate(ie, locale)} />
                                ))}

                                <Reactions
                                    reactions={reactionsProps.reactions}
                                    onClick={onReactionsToggle({ goalId: goal.id })}
                                >
                                    {nullable(!reactionsProps.limited, () => (
                                        <ReactionsDropdown onClick={onReactionsToggle({ goalId: goal.id })} />
                                    ))}
                                </Reactions>
                            </IssueBaseActions>

                            {nullable(isUserAllowedToEdit, () => (
                                <Button text={t('Edit goal')} onClick={dispatchModalEvent(ModalEvent.GoalEditModal)} />
                            ))}
                        </CardActions>
                    </Card>

                    <ActivityFeed id="comments">
                        {goal.comments?.map((comment) =>
                            nullable(comment, (c) => (
                                <CommentView
                                    key={c.id}
                                    id={c.id}
                                    author={c.activity?.user}
                                    description={c.description}
                                    createdAt={c.createdAt}
                                    isEditable={c.activity?.id === user.activityId}
                                    isNew={c.id === highlightCommentId}
                                    reactions={c.reactions}
                                    onReactionToggle={onReactionsToggle({ commentId: c.id })}
                                />
                            )),
                        )}

                        <CommentCreateForm
                            goalId={goal.id}
                            autoFocus={commentFormFocus}
                            onSubmit={onCommentPublish}
                            onBlur={() => setCommentFormFocus(false)}
                        />
                    </ActivityFeed>
                </div>

                <StyledIssueDeps>
                    <IssueParticipants issue={goal} onChange={isUserAllowedToEdit ? onParticipantsChange : undefined} />
                    <IssueDependencies issue={goal} onChange={isUserAllowedToEdit ? onDependenciesChange : undefined} />
                </StyledIssueDeps>
            </IssueContent>

            {nullable(isUserAllowedToEdit, () => (
                <ModalOnEvent
                    event={ModalEvent.GoalEditModal}
                    hotkeys={editGoalKeys}
                    visible={goalEditModalVisible}
                    onShow={onGoalEditModalShow}
                >
                    <GoalEditForm goal={goal} onSubmit={onGoalEdit} />
                </ModalOnEvent>
            ))}
        </Page>
    );
};

export default GoalPage;
