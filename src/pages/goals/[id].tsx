/* eslint-disable prefer-destructuring */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useRouter as useNextRouter } from 'next/router';

import { State, GoalDependencyToggleInput, Project, Activity, Comment } from '../../../graphql/@generated/genql';
import { gql } from '../../utils/gql';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { formatEstimate } from '../../utils/dateTime';
import { nullable } from '../../utils/nullable';
import { editGoalKeys } from '../../utils/hotkeys';
import { goalFetcher, refreshInterval } from '../../utils/entityFetcher';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { danger0, gapM, gapS } from '../../design/@generated/themes';
import { Page, PageContent, PageActions } from '../../components/Page';
import { PageSep } from '../../components/PageSep';
import { Link } from '../../components/Link';
import { Card, CardInfo, CardContent, CardActions } from '../../components/Card';
import { IssueTitle } from '../../components/IssueTitle';
import { IssueKey } from '../../components/IssueKey';
import { IssueStats } from '../../components/IssueStats';
import { UserPic } from '../../components/UserPic';
import { Button } from '../../components/Button';
import { Reactions } from '../../components/Reactions';
import { CommentView } from '../../components/CommentView';
import { StateDot } from '../../components/StateDot';
import { IssueParent } from '../../components/IssueParent';
import { IssueTags } from '../../components/IssueTags';
import { useHighlightedComment } from '../../hooks/useHighlightedComment';
import { useGoalUpdate } from '../../hooks/useGoalUpdate';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useWillUnmount } from '../../hooks/useWillUnmount';
import { ActivityFeed } from '../../components/ActivityFeed';
import { useReactionsResource } from '../../hooks/useReactionsResource';
import { WatchButton } from '../../components/WatchButton';
import { useGoalResource } from '../../hooks/useGoalResource';
import { StarButton } from '../../components/StarButton';
import { useRouter } from '../../hooks/router';
import { Icon } from '../../components/Icon';
import { MenuItem } from '../../components/MenuItem';
import { GoalDeleteModal } from '../../components/GoalDeleteModal';

const StateSwitch = dynamic(() => import('../../components/StateSwitch'));
const Md = dynamic(() => import('../../components/Md'));
const RelativeTime = dynamic(() => import('../../components/RelativeTime'));
const ModalOnEvent = dynamic(() => import('../../components/ModalOnEvent'));
const GoalEditForm = dynamic(() => import('../../components/GoalEditForm'));
const CommentCreateForm = dynamic(() => import('../../components/CommentCreateForm'));
const ReactionsDropdown = dynamic(() => import('../../components/ReactionsDropdown'));
const IssueDependencies = dynamic(() => import('../../components/IssueDependencies'));
const IssueParticipants = dynamic(() => import('../../components/IssueParticipants'));
const Dropdown = dynamic(() => import('../../components/Dropdown'));

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
    ${({ align }) => `
        justify-self: ${align};
    `}

    ${({ align }) =>
        align === 'right' &&
        `
            display: grid;
            justify-items: end;
            align-content: space-between;
        `}
`;

const IssueBaseActions = styled.div`
    display: flex;
    align-items: center;

    & > * {
        margin-right: ${gapS};
    }
`;

const StyledCardInfo = styled(CardInfo)`
    display: grid;
    grid-template-columns: 6fr 6fr;
`;

const StyledCardActions = styled.div`
    display: flex;
    align-items: center;
    justify-self: end;

    margin-right: -10px;

    & > span + span {
        margin-left: ${gapS};
    }
`;

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { id } }) => {
        const ssrData = await goalFetcher(user, id);

        return ssrData.goal
            ? { ssrData }
            : {
                  notFound: true,
              };
    },
    {
        private: true,
    },
);

const GoalPage = ({
    user,
    locale,
    ssrTime,
    ssrData: fallbackData,
    params: { id },
}: ExternalPageProps<Awaited<ReturnType<typeof goalFetcher>>, { id: string }>) => {
    const router = useRouter();
    const nextRouter = useNextRouter();
    const t = useTranslations('goals.id');

    const { data, mutate } = useSWR([user, id], goalFetcher, {
        refreshInterval,
        fallbackData,
    });

    if (!data) return null;

    const goal = data.goal;

    if (!goal) return nextRouter.push('/404');

    const project: Project | undefined = goal.project;
    const issuer: Activity | undefined = goal.activity;
    const owner: Activity | undefined = goal.owner;

    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);
    useEffect(() => {
        project &&
            setCurrentProjectCache({
                ...project,
                kind: 'project',
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const { toggleGoalWatching, toggleGoalStar } = useGoalResource(goal.id);
    const [watcher, setWatcher] = useState(goal._isWatching);
    const onWatchToggle = useCallback(() => {
        setWatcher(!watcher);
    }, [watcher]);

    const [stargizer, setStargizer] = useState(goal._isStarred);
    const onStarToggle = useCallback(() => {
        setStargizer(!stargizer);
    }, [stargizer]);

    const priorityColorIndex = data.goalPriorityKind?.indexOf(goal.priority || '') ?? -1;
    const priorityColor = priorityColorIndex >= 0 ? data.goalPriorityColors?.[priorityColorIndex] : undefined;
    const { highlightCommentId, setHighlightCommentId } = useHighlightedComment();
    const updateGoal = useGoalUpdate(t, goal);
    const { reactionsProps, goalReaction, commentReaction } = useReactionsResource(goal.reactions);

    const onGoalStateChange = useCallback(
        async (state: State) => {
            await updateGoal({
                stateId: state.id,
            });

            mutate();
        },
        [updateGoal, mutate],
    );

    const onGoalReactionToggle = useCallback((id: string) => goalReaction(id, mutate), [mutate, goalReaction]);

    const onParticipantsChange = useCallback(
        async (participants: string[]) => {
            await updateGoal({
                participants,
            });

            mutate();
        },
        [mutate, updateGoal],
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

            mutate();
        },
        [mutate, t],
    );

    const onCommentPublish = useCallback(
        (id?: string) => {
            mutate();
            setHighlightCommentId(id);
        },
        [mutate, setHighlightCommentId],
    );
    const onCommentReactionToggle = useCallback((id: string) => commentReaction(id, mutate), [mutate, commentReaction]);
    const onCommentDelete = useCallback(() => {
        mutate();
    }, [mutate]);

    const [goalEditModalVisible, setGoalEditModalVisible] = useState(false);
    const onGoalEdit = useCallback(
        (id?: string) => {
            setGoalEditModalVisible(false);

            if (goal.id !== id) {
                router.goal(id);
            } else {
                mutate();
            }
        },
        [mutate, goal.id, router],
    );
    const onGoalEditModalShow = useCallback(() => {
        setGoalEditModalVisible(true);
    }, []);

    const onEditMenuChange = useCallback((item: { onClick: () => void }) => {
        item.onClick?.();
    }, []);

    const onGoalDeleteConfirm = useCallback(async () => {
        const promise = gql.mutation({
            toggleGoalArchive: [
                {
                    data: {
                        id: goal.id,
                        archived: true,
                    },
                },
                {
                    id: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are deleting the goal'),
            success: t('Deleted successfully 🎉'),
        });

        await promise;

        router.goals();
    }, [t, goal, router]);

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

                    {nullable(goal.team, (team) => (
                        <IssueParent kind="team" parent={team} />
                    ))}

                    {Boolean(project?.teams?.length) &&
                        nullable(project?.teams, (teams) => <IssueParent kind="team" size="m" parent={teams} />)}

                    {nullable(project, (project) => (
                        <IssueParent kind="project" parent={project} />
                    ))}

                    <IssueTitle title={goal.title} />

                    {nullable(goal.state, (s) => (
                        <StateSwitch state={s} flowId={project?.flowId} onClick={onGoalStateChange} />
                    ))}

                    <IssueStats comments={goal.comments?.length ?? 0} updatedAt={goal.updatedAt} />
                </StyledIssueInfo>

                <StyledIssueInfo align="right">
                    <PageActions>
                        <WatchButton watcher={watcher} onToggle={toggleGoalWatching(onWatchToggle, t, watcher)} />
                        <StarButton
                            stargizer={stargizer}
                            count={goal._count?.stargizers}
                            onToggle={toggleGoalStar(onStarToggle, t, stargizer)}
                        />
                    </PageActions>
                </StyledIssueInfo>
            </IssueHeader>

            <PageSep />

            <IssueContent>
                <div>
                    <Card>
                        <StyledCardInfo>
                            <div>
                                <Link inline>{issuer?.user?.name}</Link> — <RelativeTime date={goal.createdAt} />
                            </div>
                            <StyledCardActions>
                                {nullable(goal._isEditable, () => (
                                    <span>
                                        <Dropdown
                                            onChange={onEditMenuChange}
                                            items={[
                                                {
                                                    label: t('Edit'),
                                                    icon: <Icon type="edit" size="xxs" />,
                                                    onClick: dispatchModalEvent(ModalEvent.GoalEditModal),
                                                },
                                                {
                                                    label: t('Delete'),
                                                    color: danger0,
                                                    icon: <Icon type="bin" size="xxs" />,
                                                    onClick: dispatchModalEvent(ModalEvent.GoalDeleteModal),
                                                },
                                            ]}
                                            renderTrigger={({ ref, onClick }) => (
                                                <Icon type="moreVertical" size="xs" ref={ref} onClick={onClick} />
                                            )}
                                            renderItem={({ item, cursor, index, onClick }) => (
                                                <MenuItem
                                                    key={item.label}
                                                    ghost
                                                    color={item.color}
                                                    focused={cursor === index}
                                                    icon={item.icon}
                                                    onClick={onClick}
                                                >
                                                    {item.label}
                                                </MenuItem>
                                            )}
                                        />
                                    </span>
                                ))}
                            </StyledCardActions>
                        </StyledCardInfo>

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
                                    text={owner?.user?.name || owner?.user?.email || owner?.ghost?.email}
                                    iconLeft={
                                        <UserPic
                                            src={owner?.user?.image}
                                            email={owner?.user?.email || owner?.ghost?.email}
                                            size={16}
                                        />
                                    }
                                />

                                {nullable(goal._lastEstimate, (ie) => (
                                    <Button ghost text={formatEstimate(ie, locale)} />
                                ))}

                                <Reactions reactions={reactionsProps.reactions} onClick={onGoalReactionToggle(goal.id)}>
                                    {nullable(!reactionsProps.limited, () => (
                                        <ReactionsDropdown onClick={onGoalReactionToggle(goal.id)} />
                                    ))}
                                </Reactions>
                            </IssueBaseActions>
                        </CardActions>
                    </Card>

                    <ActivityFeed id="comments">
                        {goal.comments?.map((comment) =>
                            nullable(comment, (c: Comment) => (
                                <CommentView
                                    key={c.id}
                                    id={c.id}
                                    author={c.activity?.user}
                                    description={c.description}
                                    createdAt={c.createdAt}
                                    isEditable={c.activity?.id === user.activityId}
                                    isNew={c.id === highlightCommentId}
                                    reactions={c.reactions}
                                    onReactionToggle={onCommentReactionToggle(c.id)}
                                    onDelete={onCommentDelete}
                                />
                            )),
                        )}

                        <CommentCreateForm goalId={goal.id} onSubmit={onCommentPublish} />
                    </ActivityFeed>
                </div>

                <div>
                    <IssueParticipants issue={goal} onChange={goal._isEditable ? onParticipantsChange : undefined} />
                    <IssueDependencies issue={goal} onChange={goal._isEditable ? onDependenciesChange : undefined} />
                </div>
            </IssueContent>

            {nullable(goal._isEditable, () => (
                <ModalOnEvent
                    event={ModalEvent.GoalEditModal}
                    hotkeys={editGoalKeys}
                    visible={goalEditModalVisible}
                    onShow={onGoalEditModalShow}
                >
                    <GoalEditForm goal={goal} onSubmit={onGoalEdit} />
                </ModalOnEvent>
            ))}

            {nullable(goal._isEditable, () => (
                <GoalDeleteModal id={goal.id} onConfirm={onGoalDeleteConfirm} />
            ))}
        </Page>
    );
};

export default GoalPage;
