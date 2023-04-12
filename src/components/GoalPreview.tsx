import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { danger0, gapM, gapS } from '@taskany/colors';
import {
    Dot,
    Button,
    Card,
    CardComment,
    CardInfo,
    Dropdown,
    Link,
    MoreVerticalIcon,
    BinIcon,
    EditIcon,
    MenuItem,
    ModalContent,
    ModalHeader,
    ModalPreview,
} from '@taskany/bricks';

import { gql } from '../utils/gql';
import { Goal, State } from '../../graphql/@generated/genql';
import { goalFetcher, refreshInterval } from '../utils/entityFetcher';
import { nullable } from '../utils/nullable';
import { formatEstimate } from '../utils/dateTime';
import { useHighlightedComment } from '../hooks/useHighlightedComment';
import { useGoalUpdate } from '../hooks/useGoalUpdate';
import { routes } from '../hooks/router';
import { usePageContext } from '../hooks/usePageContext';
import { useReactionsResource } from '../hooks/useReactionsResource';
import { dispatchModalEvent, ModalEvent } from '../utils/dispatchModal';
import { editGoalKeys } from '../utils/hotkeys';
import { Priority, priorityColorsMap } from '../types/priority';
import { trPriority } from '../i18n/priority';

import { IssueKey } from './IssueKey';
import { IssueTitle } from './IssueTitle';
import { IssueParent } from './IssueParent';
import { IssueTags } from './IssueTags';
import { StateDot } from './StateDot';
import { UserPic } from './UserPic';
import RelativeTime from './RelativeTime';
import Md from './Md';
import { IssueStats } from './IssueStats';
import { CommentView } from './CommentView';
import { ActivityFeed } from './ActivityFeed';
import { Reactions } from './Reactions';
import ReactionsDropdown from './ReactionsDropdown';
import { GoalDeleteModal } from './GoalDeleteModal';

const StateSwitch = dynamic(() => import('./StateSwitch'));
const CommentCreateForm = dynamic(() => import('./CommentCreateForm'));
const ModalOnEvent = dynamic(() => import('./ModalOnEvent'));
const GoalEditForm = dynamic(() => import('./GoalEditForm'));

interface GoalPreviewProps {
    goal: Goal;

    onClose?: () => void;
    onDelete?: () => void;
}

const StyledImportantActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const StyledPublicActions = styled.div`
    display: flex;
    align-items: center;

    & > * {
        margin-right: ${gapS};
    }
`;

const StyledModalHeader = styled(ModalHeader)`
    position: sticky;

    box-shadow: 0 2px 5px 2px rgb(0 0 0 / 10%);
`;

const StyledModalContent = styled(ModalContent)`
    overflow: auto;
    height: 100%;

    padding-top: ${gapM};
`;

const StyledCard = styled(Card)`
    min-height: 60px;
`;

const GoalPreview: React.FC<GoalPreviewProps> = ({ goal: partialGoal, onClose, onDelete }) => {
    const t = useTranslations('goals.id');
    const { user, locale } = usePageContext();
    const { highlightCommentId, setHighlightCommentId } = useHighlightedComment();

    const { data, mutate } = useSWR(`goal-${partialGoal.id}`, () => goalFetcher(user, partialGoal.id), {
        refreshInterval,
    });
    const refresh = useCallback(() => mutate(), [mutate]);

    const goal: Goal = data?.goal ?? partialGoal;

    const isUserAllowedToEdit = user?.activityId === goal?.activityId || user?.activityId === goal?.ownerId;
    const [goalEditModalVisible, setGoalEditModalVisible] = useState(false);
    const onGoalEdit = useCallback(() => {
        setGoalEditModalVisible(false);

        refresh();
    }, [refresh]);
    const onGoalEditModalShow = useCallback(() => {
        setGoalEditModalVisible(true);
    }, []);

    const updateGoal = useGoalUpdate(goal);
    const { reactionsProps, goalReaction, commentReaction } = useReactionsResource(goal.reactions);

    const priorityColor = priorityColorsMap[goal.priority as Priority];
    const issueEstimate = goal.estimate?.length ? goal.estimate[goal.estimate.length - 1] : undefined;

    const onGoalStateChange = useCallback(
        async (state: State) => {
            await updateGoal({
                stateId: state.id,
            });

            refresh();
        },
        [updateGoal, refresh],
    );

    const onCommentPublish = useCallback(
        (id?: string) => {
            refresh();
            setHighlightCommentId(id);
        },
        [refresh, setHighlightCommentId],
    );

    const onGoalReactionToggle = useCallback((id: string) => goalReaction(id, refresh), [refresh, goalReaction]);
    const onCommentReactionToggle = useCallback(
        (id: string) => commentReaction(id, refresh),
        [refresh, commentReaction],
    );

    const onPreviewClose = useCallback(() => {
        setGoalEditModalVisible(false);
        onClose?.();
    }, [onClose]);

    const onEditMenuChange = useCallback((item: { onClick: () => void }) => {
        item.onClick?.();
    }, []);

    const onGoalDeleteConfirm = useCallback(async () => {
        onDelete?.();
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

        refresh();
    }, [t, goal, refresh, onDelete]);

    return (
        <>
            <ModalPreview visible onClose={onPreviewClose}>
                <StyledModalHeader>
                    {nullable(goal.id, (id) => (
                        <IssueKey size="s" id={id}>
                            {nullable(goal.tags, (tags) => (
                                <IssueTags tags={tags} size="s" />
                            ))}
                        </IssueKey>
                    ))}

                    {nullable(goal.team, (team) => (
                        <IssueParent kind="team" as="span" mode="compact" parent={team} size="m" />
                    ))}

                    {Boolean(goal.project?.teams?.length) &&
                        nullable(goal.project?.teams, (teams) => (
                            <>
                                <IssueParent kind="team" as="span" mode="compact" parent={teams} size="m" />
                                <Dot />
                            </>
                        ))}

                    {nullable(goal.project, (project) => (
                        <IssueParent kind="project" as="span" mode="compact" parent={project} size="m" />
                    ))}

                    <IssueStats mode="compact" comments={goal.comments?.length || 0} updatedAt={goal.updatedAt} />

                    {nullable(goal.title, (title) => (
                        <IssueTitle title={title} href={routes.goal(goal.id)} size="xl" />
                    ))}

                    <StyledImportantActions>
                        <StyledPublicActions>
                            {nullable(goal.state, (s) => (
                                <StateSwitch state={s} flowId={goal.project?.flowId} onClick={onGoalStateChange} />
                            ))}

                            {nullable(goal.priority, (ip) => (
                                <Button
                                    ghost
                                    text={trPriority(ip as Priority)}
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

                            <Reactions reactions={reactionsProps.reactions} onClick={onGoalReactionToggle(goal.id)}>
                                {nullable(!reactionsProps.limited, () => (
                                    <ReactionsDropdown onClick={onGoalReactionToggle(goal.id)} />
                                ))}
                            </Reactions>
                        </StyledPublicActions>

                        {nullable(isUserAllowedToEdit, () => (
                            <Dropdown
                                onChange={onEditMenuChange}
                                items={[
                                    {
                                        label: t('Edit'),
                                        icon: <EditIcon size="xxs" />,
                                        onClick: dispatchModalEvent(ModalEvent.GoalEditModal),
                                    },
                                    {
                                        label: t('Delete'),
                                        color: danger0,
                                        icon: <BinIcon size="xxs" />,
                                        onClick: dispatchModalEvent(ModalEvent.GoalDeleteModal),
                                    },
                                ]}
                                renderTrigger={({ ref, onClick }) => (
                                    <Button
                                        ref={ref}
                                        ghost
                                        iconLeft={<MoreVerticalIcon noWrap size="xs" />}
                                        onClick={onClick}
                                    />
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
                        ))}
                    </StyledImportantActions>
                </StyledModalHeader>
                <StyledModalContent>
                    <StyledCard>
                        <CardInfo>
                            <Link inline>{goal.activity?.user?.name}</Link> — <RelativeTime date={goal.createdAt} />
                        </CardInfo>

                        <CardComment>
                            <Md>{goal.description}</Md>
                        </CardComment>
                    </StyledCard>

                    {nullable(data, () => (
                        <ActivityFeed id="comments">
                            {goal.comments?.map((comment) =>
                                nullable(comment, (c) => (
                                    <CommentView
                                        key={c.id}
                                        id={c.id}
                                        author={c.activity?.user}
                                        description={c.description}
                                        createdAt={c.createdAt}
                                        isEditable={c.activity?.id === user?.activityId}
                                        isNew={c.id === highlightCommentId}
                                        reactions={c.reactions}
                                        onReactionToggle={onCommentReactionToggle(c.id)}
                                    />
                                )),
                            )}

                            <CommentCreateForm goalId={goal.id} onSubmit={onCommentPublish} />
                        </ActivityFeed>
                    ))}
                </StyledModalContent>
            </ModalPreview>

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

            {nullable(isUserAllowedToEdit, () => (
                <GoalDeleteModal id={goal.id} onConfirm={onGoalDeleteConfirm} />
            ))}
        </>
    );
};

export default GoalPreview;
