import React, { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import styled from 'styled-components';

import { Goal, State } from '../../graphql/@generated/genql';
import { gapM, gapS } from '../design/@generated/themes';
import { goalFetcher, refreshInterval } from '../utils/entityFetcher';
import { nullable } from '../utils/nullable';
import { formatEstimate } from '../utils/dateTime';
import { TLocale } from '../types/locale';
import { useHighlightedComment } from '../hooks/useHighlightedComment';
import { useGoalUpdate } from '../hooks/useGoalUpdate';
import { routes } from '../hooks/router';

import { ModalHeader, ModalContent } from './Modal';
import { ModalPreview } from './ModalPreview';
import { IssueKey } from './IssueKey';
import { IssueTitle } from './IssueTitle';
import { IssueProject } from './IssueProject';
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

const StateSwitch = dynamic(() => import('./StateSwitch'));
const CommentCreateForm = dynamic(() => import('./CommentCreateForm'));

interface GoalPreviewProps {
    goal: Goal;
    locale: TLocale;

    visible?: boolean;

    onClose?: () => void;
}

const StyledImportantActions = styled.div`
    display: flex;
    align-items: center;

    & > * {
        margin-right: ${gapS};
    }
`;

const StyledActivityFeed = styled.div`
    display: grid;
    row-gap: ${gapM};

    padding-top: ${gapM};
    padding-bottom: 200px;
`;

const StyledModalHeader = styled(ModalHeader)`
    position: sticky;

    box-shadow: 0 5px 10px 5px rgb(0 0 0 / 30%);
`;

const StyledModalContent = styled(ModalContent)`
    overflow: auto;
    height: 100%;

    padding-top: ${gapM};
`;

const StyledCard = styled(Card)`
    min-height: 60px;
`;

const GoalPreview: React.FC<GoalPreviewProps> = ({ goal: partialGoal, visible, locale, onClose }) => {
    const t = useTranslations('goals.id');
    const { data: session } = useSession();
    const [commentFormFocus, setCommentFormFocus] = useState(false);
    const { highlightCommentId, setHighlightCommentId } = useHighlightedComment();

    const { data, mutate } = useSWR([session?.user, partialGoal.id], (...args) => goalFetcher(...args), {
        refreshInterval,
    });
    const refresh = useCallback(() => mutate(), [mutate]);

    const goal: Goal = data?.goal ?? partialGoal;

    const updateGoal = useGoalUpdate(t, goal);

    const priorityColorIndex = data?.goalPriorityKind?.indexOf(goal.priority || '') ?? -1;
    const priorityColor = priorityColorIndex >= 0 ? data?.goalPriorityColors?.[priorityColorIndex] : undefined;
    const issueEstimate = goal.estimate?.length ? goal.estimate[goal.estimate.length - 1] : undefined;

    const onModalClose = useCallback(() => {
        onClose?.();
    }, [onClose]);

    const onGoalStateChange = useCallback(
        async (state: State) => {
            await updateGoal({
                stateId: state.id,
            });

            refresh();
        },
        [updateGoal, refresh],
    );

    const onCommentLinkClick = useCallback(() => {
        setCommentFormFocus(true);
    }, []);

    const onCommentPublish = useCallback(
        (id?: string) => {
            refresh();
            setHighlightCommentId(id);
            setCommentFormFocus(false);
        },
        [refresh, setHighlightCommentId],
    );

    return (
        <ModalPreview visible={visible} onClose={onModalClose}>
            <StyledModalHeader>
                {nullable(goal.id, (id) => (
                    <IssueKey size="s" id={id}>
                        {nullable(goal.tags, (tags) => (
                            <IssueTags tags={tags} size="s" />
                        ))}
                    </IssueKey>
                ))}

                {nullable(goal.project, (project) => (
                    <IssueProject as="span" mode="compact" project={project} size="m" />
                ))}

                <IssueStats
                    mode="compact"
                    locale={locale}
                    comments={goal.comments?.length || 0}
                    updatedAt={goal.updatedAt}
                    onCommentsClick={onCommentLinkClick}
                />

                {nullable(goal.title, (title) => (
                    <IssueTitle title={title} href={routes.goal(goal.id)} size="xl" />
                ))}

                <StyledImportantActions>
                    {nullable(goal.state, (s) => (
                        <StateSwitch state={s} flowId={goal.project?.flowId} onClick={onGoalStateChange} />
                    ))}

                    {nullable(goal.priority, (ip) => (
                        <Button ghost text={t(`Priority.${ip}`)} iconLeft={<StateDot hue={priorityColor} />} />
                    ))}

                    {nullable(issueEstimate, (ie) => (
                        <Button ghost text={formatEstimate(ie, locale)} />
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
                </StyledImportantActions>
            </StyledModalHeader>
            <StyledModalContent>
                <StyledCard>
                    <CardInfo>
                        <Link inline>{goal.activity?.user?.name}</Link> —{' '}
                        <RelativeTime locale={locale} date={goal.createdAt} />
                    </CardInfo>

                    <CardComment>
                        <Md>{goal.description}</Md>
                    </CardComment>
                </StyledCard>

                {nullable(data, () => (
                    <StyledActivityFeed>
                        <div id="comments" />

                        {goal.comments?.map((comment) =>
                            nullable(comment, (c) => (
                                <CommentView
                                    key={c.id}
                                    id={c.id}
                                    locale={locale}
                                    author={c.activity?.user}
                                    description={c.description}
                                    createdAt={c.createdAt}
                                    isEditable={c.activity?.id === session?.user?.activityId}
                                    isNew={c.id === highlightCommentId}
                                    reactions={c.reactions}
                                    // onReactionToggle={onReactionsToggle({ commentId: c.id })}
                                />
                            )),
                        )}

                        <CommentCreateForm
                            locale={locale}
                            goalId={goal.id}
                            user={session?.user}
                            setFocus={commentFormFocus}
                            onCreate={onCommentPublish}
                            onBlur={() => setCommentFormFocus(false)}
                        />
                    </StyledActivityFeed>
                ))}
            </StyledModalContent>
        </ModalPreview>
    );
};

export default GoalPreview;
