import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import styled from 'styled-components';

import { Goal, State } from '../../graphql/@generated/genql';
import { gapM, gapS } from '../design/@generated/themes';
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

import { ModalHeader, ModalContent } from './Modal';
import { ModalPreview } from './ModalPreview';
import { IssueKey } from './IssueKey';
import { IssueTitle } from './IssueTitle';
import { IssueParent } from './IssueParent';
import { IssueTags } from './IssueTags';
import { Button } from './Button';
import { StateDot } from './StateDot';
import { UserPic } from './UserPic';
import { Card, CardComment, CardInfo } from './Card';
import RelativeTime from './RelativeTime';
import Md from './Md';
import { Link } from './Link';
import { IssueStats } from './IssueStats';
import { CommentView } from './CommentView';
import { ActivityFeed } from './ActivityFeed';
import { Reactions } from './Reactions';
import ReactionsDropdown from './ReactionsDropdown';
import { Dot } from './Dot';
import { Icon } from './Icon';

const StateSwitch = dynamic(() => import('./StateSwitch'));
const CommentCreateForm = dynamic(() => import('./CommentCreateForm'));
const ModalOnEvent = dynamic(() => import('./ModalOnEvent'));
const GoalEditForm = dynamic(() => import('./GoalEditForm'));

interface GoalPreviewProps {
    goal: Goal;

    visible?: boolean;

    onClose?: () => void;
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

const GoalPreview: React.FC<GoalPreviewProps> = ({ goal: partialGoal, visible, onClose }) => {
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

    const updateGoal = useGoalUpdate(t, goal);
    const { reactionsProps, goalReaction, commentReaction } = useReactionsResource(goal.reactions);

    const priorityColorIndex = data?.goalPriorityKind?.indexOf(goal.priority || '') ?? -1;
    const priorityColor = priorityColorIndex >= 0 ? data?.goalPriorityColors?.[priorityColorIndex] : undefined;
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

    return (
        <>
            <ModalPreview visible={visible} onClose={onPreviewClose}>
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
                                <Button ghost text={t(`Priority.${ip}`)} iconLeft={<StateDot hue={priorityColor} />} />
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
                            <Button
                                ghost
                                iconLeft={<Icon noWrap type="edit" size="xs" />}
                                onClick={dispatchModalEvent(ModalEvent.GoalEditModal)}
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
        </>
    );
};

export default GoalPreview;
