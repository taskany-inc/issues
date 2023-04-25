/* eslint-disable prefer-destructuring */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useRouter as useNextRouter } from 'next/router';
import { danger0, gapM, gapS } from '@taskany/colors';
import {
    Button,
    Card,
    CardInfo,
    CardContent,
    CardActions,
    Dropdown,
    Link,
    EditIcon,
    BinIcon,
    MoreVerticalIcon,
    MenuItem,
    UserPic,
    nullable,
} from '@taskany/bricks';

import { State, GoalDependencyToggleInput, Project, Activity, Comment } from '../../../../graphql/@generated/genql';
import { gql } from '../../../utils/gql';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { formatEstimate } from '../../../utils/dateTime';
import { editGoalKeys } from '../../../utils/hotkeys';
import { goalFetcher, refreshInterval } from '../../../utils/entityFetcher';
import { ModalEvent, dispatchModalEvent } from '../../../utils/dispatchModal';
import { Page, PageContent, PageActions } from '../../Page';
import { PageSep } from '../../PageSep';
import { IssueTitle } from '../../IssueTitle';
import { IssueKey } from '../../IssueKey';
import { IssueStats } from '../../IssueStats/IssueStats';
import { Reactions } from '../../Reactions';
import { CommentView } from '../../CommentView/CommentView';
import { StateDot } from '../../StateDot';
import { IssueParent } from '../../IssueParent';
import { IssueTags } from '../../IssueTags';
import { getPriorityText } from '../../PriorityText/PriorityText';
import { useHighlightedComment } from '../../../hooks/useHighlightedComment';
import { useGoalUpdate } from '../../../hooks/useGoalUpdate';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useWillUnmount } from '../../../hooks/useWillUnmount';
import { ActivityFeed } from '../../ActivityFeed';
import { useReactionsResource } from '../../../hooks/useReactionsResource';
import { WatchButton } from '../../WatchButton/WatchButton';
import { useGoalResource } from '../../../hooks/useGoalResource';
import { StarButton } from '../../StarButton/StarButton';
import { useRouter } from '../../../hooks/router';
import { GoalDeleteModal } from '../../GoalDeleteModal/GoalDeleteModal';
import { Priority, priorityColorsMap } from '../../../types/priority';

import { tr } from './GoalPage.i18n';

const StateSwitch = dynamic(() => import('../../StateSwitch'));
const Md = dynamic(() => import('../../Md'));
const RelativeTime = dynamic(() => import('../../RelativeTime/RelativeTime'));
const ModalOnEvent = dynamic(() => import('../../ModalOnEvent'));
const GoalEditForm = dynamic(() => import('../../GoalEditForm/GoalEditForm'));
const CommentCreateForm = dynamic(() => import('../../CommentCreateForm/CommentCreateForm'));
const ReactionsDropdown = dynamic(() => import('../../ReactionsDropdown'));
const IssueDependencies = dynamic(() => import('../../IssueDependencies/IssueDependencies'));
const IssueParticipants = dynamic(() => import('../../IssueParticipants/IssueParticipants'));

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
            ? {
                  fallback: {
                      [id]: ssrData,
                  },
              }
            : {
                  notFound: true,
              };
    },
    {
        private: true,
    },
);

export const GoalPage = ({ user, locale, ssrTime, fallback, params: { id } }: ExternalPageProps<{ id: string }>) => {
    const router = useRouter();
    const nextRouter = useNextRouter();

    const { data, mutate } = useSWR(id, () => goalFetcher(user, id), {
        fallback,
        refreshInterval,
    });

    if (!data) return null;

    const goal = data.goal;

    if (!goal) return nextRouter.push('/404');

    const project: Project | undefined = goal.project;
    const issuer: Activity | undefined = goal.activity;
    const owner: Activity | undefined = goal.owner;

    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);
    useEffect(() => {
        project && setCurrentProjectCache(project);
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

    const priority = goal.priority as Priority;
    const priorityColor = priorityColorsMap[priority];
    const { highlightCommentId, setHighlightCommentId } = useHighlightedComment();
    const updateGoal = useGoalUpdate(goal);
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
        async (data: GoalDependencyToggleInput) => {
            const promise = gql.mutation({
                toggleGoalDependency: [
                    {
                        data,
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are updating the goal'),
                success: tr('Voila! Goal is up to date 🎉'),
            });

            await promise;

            mutate();
        },
        [mutate],
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
            error: tr('Something went wrong 😿'),
            loading: tr('We are deleting the goal'),
            success: tr('Deleted successfully 🎉'),
        });

        await promise;

        router.goals();
    }, [goal, router]);

    const pageTitle = tr
        .raw('title', {
            goal: goal.title,
        })
        .join('');

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={pageTitle}>
            <IssueHeader>
                <StyledIssueInfo align="left">
                    <IssueKey id={goal.id}>
                        {nullable(goal.tags, (tags) => (
                            <IssueTags tags={tags} />
                        ))}
                    </IssueKey>

                    {Boolean(project?.parent?.length) &&
                        nullable(project?.parent, (parent) => <IssueParent size="m" parent={parent} />)}

                    {nullable(project, (project) => (
                        <IssueParent parent={project} />
                    ))}

                    <IssueTitle title={goal.title} />

                    {nullable(goal.state, (s) => (
                        <StateSwitch state={s} flowId={project?.flowId} onClick={onGoalStateChange} />
                    ))}

                    <IssueStats comments={goal.comments?.length ?? 0} updatedAt={goal.updatedAt} />
                </StyledIssueInfo>

                <StyledIssueInfo align="right">
                    <PageActions>
                        <WatchButton watcher={watcher} onToggle={toggleGoalWatching(onWatchToggle, watcher)} />
                        <StarButton
                            stargizer={stargizer}
                            count={goal._count?.stargizers}
                            onToggle={toggleGoalStar(onStarToggle, stargizer)}
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
                                                    label: tr('Edit'),
                                                    icon: <EditIcon size="xxs" />,
                                                    onClick: dispatchModalEvent(ModalEvent.GoalEditModal),
                                                },
                                                {
                                                    label: tr('Delete'),
                                                    color: danger0,
                                                    icon: <BinIcon size="xxs" />,
                                                    onClick: dispatchModalEvent(ModalEvent.GoalDeleteModal),
                                                },
                                            ]}
                                            renderTrigger={({ ref, onClick }) => (
                                                <MoreVerticalIcon size="xs" ref={ref} onClick={onClick} />
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
                                {nullable(priority, (ip) => (
                                    <Button
                                        ghost
                                        text={getPriorityText(ip)}
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
