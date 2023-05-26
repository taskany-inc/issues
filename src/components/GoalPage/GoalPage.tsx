/* eslint-disable prefer-destructuring */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
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

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { formatEstimate } from '../../utils/dateTime';
import { editGoalKeys } from '../../utils/hotkeys';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { Page, PageContent, PageActions } from '../Page';
import { PageSep } from '../PageSep';
import { IssueTitle } from '../IssueTitle';
import { IssueKey } from '../IssueKey';
import { IssueStats } from '../IssueStats/IssueStats';
import { Reactions } from '../Reactions';
import { CommentView } from '../CommentView/CommentView';
import { StateDot } from '../StateDot';
import { IssueParent } from '../IssueParent';
import { IssueTags } from '../IssueTags';
import { getPriorityText } from '../PriorityText/PriorityText';
import { useHighlightedComment } from '../../hooks/useHighlightedComment';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useWillUnmount } from '../../hooks/useWillUnmount';
import { ActivityFeed } from '../ActivityFeed';
import { useReactionsResource } from '../../hooks/useReactionsResource';
import { WatchButton } from '../WatchButton/WatchButton';
import { useGoalResource } from '../../hooks/useGoalResource';
import { StarButton } from '../StarButton/StarButton';
import { useRouter } from '../../hooks/router';
import { GoalDeleteModal } from '../GoalDeleteModal/GoalDeleteModal';
import { Priority, priorityColorsMap } from '../../types/priority';
import { trpc } from '../../utils/trpcClient';
import { GoalParticipantsSchema, GoalStateChangeSchema, ToggleGoalDependency } from '../../schema/goal';
import { refreshInterval } from '../../utils/config';
import { notifyPromise } from '../../utils/notifyPromise';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';

import { tr } from './GoalPage.i18n';

const StateSwitch = dynamic(() => import('../StateSwitch'));
const Md = dynamic(() => import('../Md'));
const RelativeTime = dynamic(() => import('../RelativeTime/RelativeTime'));
const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const GoalEditForm = dynamic(() => import('../GoalEditForm/GoalEditForm'));
const CommentCreateForm = dynamic(() => import('../CommentCreateForm/CommentCreateForm'));
const ReactionsDropdown = dynamic(() => import('../ReactionsDropdown'));
const IssueDependencies = dynamic(() => import('../IssueDependencies/IssueDependencies'));
const IssueParticipants = dynamic(() => import('../IssueParticipants/IssueParticipants'));

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

const StyledMenuItem = styled(MenuItem)`
    display: flex;
    justify-content: start;
`;

export const GoalPage = ({ user, locale, ssrTime, params: { id } }: ExternalPageProps<{ id: string }>) => {
    const router = useRouter();

    const utils = trpc.useContext();

    const { data: goal } = trpc.goal.getById.useQuery(id, {
        staleTime: refreshInterval,
    });

    const project = goal?.project;
    const issuer = goal?.activity;
    const owner = goal?.owner;

    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);
    useEffect(() => {
        project && setCurrentProjectCache(project);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const { toggleGoalWatching, toggleGoalStar } = useGoalResource(id);

    const priority = goal?.priority as Priority;
    const priorityColor = priorityColorsMap[priority];
    const { highlightCommentId, setHighlightCommentId } = useHighlightedComment();
    const { reactionsProps, goalReaction, commentReaction } = useReactionsResource(goal?.reactions);

    const stateMutation = trpc.goal.switchState.useMutation();
    const onGoalStateChange = useCallback(
        async (nextState: GoalStateChangeSchema['state']) => {
            if (goal) {
                await stateMutation.mutateAsync({
                    state: nextState,
                    id: goal.id,
                });
                utils.goal.getById.invalidate(id);
            }
        },
        [goal, id, stateMutation, utils.goal.getById],
    );

    const onGoalReactionToggle = useCallback(
        (id: string) => goalReaction(id, () => utils.goal.getById.invalidate(id)),
        [goalReaction, utils.goal.getById],
    );

    const participantsMutation = trpc.goal.toggleParticipants.useMutation();
    const onParticipantsChange = useCallback(
        async (participants: GoalParticipantsSchema['participants']) => {
            await participantsMutation.mutateAsync({ participants, id });
            utils.goal.getById.invalidate(id);
        },
        [participantsMutation, utils.goal.getById, id],
    );

    const toggleDependencyMutation = trpc.goal.toggleDependency.useMutation();
    const onDependenciesChange = useCallback(
        async (data: ToggleGoalDependency) => {
            const promise = toggleDependencyMutation.mutateAsync(data);

            await notifyPromise(promise, 'goalsUpdate');

            utils.goal.getById.invalidate(id);
        },
        [id, toggleDependencyMutation, utils.goal.getById],
    );

    const onCommentPublish = useCallback(
        (commentId?: string) => {
            utils.goal.getById.invalidate(id);
            setHighlightCommentId(commentId);
        },
        [id, setHighlightCommentId, utils.goal.getById],
    );
    const onCommentReactionToggle = useCallback(
        (id: string) => commentReaction(id, () => utils.goal.getById.invalidate(id)),
        [commentReaction, utils.goal.getById],
    );
    const onCommentDelete = useCallback(() => {
        utils.goal.getById.invalidate(id);
    }, [id, utils.goal.getById]);

    const [goalEditModalVisible, setGoalEditModalVisible] = useState(false);
    const onGoalEdit = useCallback(
        (editedGoal?: GoalByIdReturnType) => {
            setGoalEditModalVisible(false);

            if (editedGoal && id !== editedGoal._shortId) {
                router.goal(editedGoal._shortId);
            } else {
                utils.goal.getById.invalidate(id);
            }
        },
        [id, router, utils.goal.getById],
    );
    const onGoalEditModalShow = useCallback(() => {
        setGoalEditModalVisible(true);
    }, []);

    const onEditMenuChange = useCallback((item: { onClick: () => void }) => {
        item.onClick?.();
    }, []);

    const toggleArchiveMutation = trpc.goal.toggleArchive.useMutation();
    const onGoalDeleteConfirm = useCallback(async () => {
        const promise = toggleArchiveMutation.mutateAsync({
            id,
            archived: true,
        });

        notifyPromise(promise, 'goalsDelete');

        await promise;

        router.goals();
    }, [id, router, toggleArchiveMutation]);

    const pageTitle = tr
        .raw('title', {
            goal: goal?.title,
        })
        .join('');

    const commentsRef = useRef<HTMLDivElement>(null);
    const onCommentsClick = useCallback(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    if (!goal) return null;

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={pageTitle}>
            <IssueHeader>
                <StyledIssueInfo align="left">
                    <IssueKey id={id}>
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

                    <IssueStats
                        comments={goal._count?.comments ?? 0}
                        onCommentsClick={onCommentsClick}
                        updatedAt={goal.updatedAt}
                    />
                </StyledIssueInfo>

                <StyledIssueInfo align="right">
                    <PageActions>
                        <WatchButton watcher={!!goal._isWatching} onToggle={toggleGoalWatching} />
                        <StarButton
                            stargizer={!!goal._isStarred}
                            count={goal._count?.stargizers}
                            onToggle={toggleGoalStar}
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
                                                <StyledMenuItem
                                                    key={item.label}
                                                    ghost
                                                    color={item.color}
                                                    focused={cursor === index}
                                                    icon={item.icon}
                                                    onClick={onClick}
                                                >
                                                    {item.label}
                                                </StyledMenuItem>
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

                    <ActivityFeed ref={commentsRef}>
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
                                    onReactionToggle={onCommentReactionToggle(c.id)}
                                    onDelete={onCommentDelete}
                                />
                            )),
                        )}

                        <CommentCreateForm goalId={goal.id} onSubmit={onCommentPublish} />
                    </ActivityFeed>
                </div>

                <div>
                    <IssueParticipants
                        participants={goal.participants}
                        onChange={goal._isEditable ? onParticipantsChange : undefined}
                    />
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
                <GoalDeleteModal shortId={goal._shortId} onConfirm={onGoalDeleteConfirm} />
            ))}
        </Page>
    );
};
