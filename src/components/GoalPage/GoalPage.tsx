/* eslint-disable prefer-destructuring */
import React, { useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import { gapM, gray7 } from '@taskany/colors';
import { Button, Card, CardInfo, CardContent, nullable, Text, Tag, TagCleanButton } from '@taskany/bricks';
import { IconEditOutline, IconBinOutline, IconPlusCircleOutline, IconArrowRightOutline } from '@taskany/icons';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { editGoalKeys } from '../../utils/hotkeys';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { Page, PageContent, PageActions } from '../Page';
import { PageSep } from '../PageSep';
import { IssueTitle } from '../IssueTitle';
import { IssueKey } from '../IssueKey';
import { IssueStats } from '../IssueStats/IssueStats';
import { IssueParent } from '../IssueParent';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useWillUnmount } from '../../hooks/useWillUnmount';
import { WatchButton } from '../WatchButton/WatchButton';
import { useGoalResource } from '../../hooks/useGoalResource';
import { useRouter } from '../../hooks/router';
import { StarButton } from '../StarButton/StarButton';
import { GoalDeleteModal } from '../GoalDeleteModal/GoalDeleteModal';
import { trpc } from '../../utils/trpcClient';
import { refreshInterval } from '../../utils/config';
import { ActivityByIdReturnType, GoalAchiveCriteria, GoalDependencyItem } from '../../../trpc/inferredTypes';
import { GoalActivity } from '../GoalActivity';
import { GoalCriteria } from '../GoalCriteria/GoalCriteria';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { IssueMeta } from '../IssueMeta';
import { UserBadge } from '../UserBadge';
import { InlineTrigger } from '../InlineTrigger';
import { UserComboBox } from '../UserComboBox';
import { State } from '../State';
import { GoalParentComboBox } from '../GoalParentComboBox';
import { GoalDependencyListByKind } from '../GoalDependencyList/GoalDependencyList';
import { GoalDependencyAddForm } from '../GoalDependencyForm/GoalDependencyForm';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import CommentCreateForm from '../CommentCreateForm/CommentCreateForm';
import { CommentView } from '../CommentView/CommentView';
import { ModalContext } from '../ModalOnEvent';
import { useFMPMetric } from '../../utils/telemetry';
import { TagComboBox } from '../TagComboBox';
import { AddCriteriaForm } from '../CriteriaForm/CriteriaForm';

import { tr } from './GoalPage.i18n';

const StateSwitch = dynamic(() => import('../StateSwitch'));
const Md = dynamic(() => import('../Md'));
const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const GoalEditForm = dynamic(() => import('../GoalEditForm/GoalEditForm'));
const ImageFullScreen = dynamic(() => import('../ImageFullScreen'));

const IssueHeader = styled(PageContent)`
    display: grid;
    grid-template-columns: 8fr 4fr;
`;

const IssueContent = styled(PageContent)`
    display: grid;
    grid-template-columns: 7fr 5fr;
    gap: ${gapM};
`;

const StyledPublicActions = styled.div`
    display: flex;
    align-items: center;
`;

const StyledCardInfo = styled(CardInfo)`
    display: grid;
    grid-template-columns: 6fr 6fr;
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

const StyledInlineTrigger = styled(InlineTrigger)`
    margin-left: 5px; // 24 / 2 - 7 center of UserPic and center of PlusIcon
`;

const StyledInlineInput = styled.div`
    display: flex;
    align-items: center;
    height: 28px;
`;

const StyledIconEditOutline = styled(IconEditOutline)``;

const StyledInlineUserInput = styled.div`
    display: flex;
    align-items: center;
    height: 28px;

    ${StyledIconEditOutline} {
        display: none;
    }

    &:hover ${StyledIconEditOutline} {
        display: block;
    }
`;

interface TagObject {
    id: string;
    title: string;
    description?: string | null;
}

const tagsLimit = 5;

export const GoalPage = ({ user, ssrTime, params: { id } }: ExternalPageProps<{ id: string }>) => {
    const router = useRouter();

    const { data: goal } = trpc.goal.getById.useQuery(id, {
        staleTime: refreshInterval,
    });

    useFMPMetric(!!goal);

    const { project, activity: issuer, owner } = goal || {};

    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);
    useEffect(() => {
        project && setCurrentProjectCache(project);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const {
        goalProjectChange,
        onGoalDelete,
        onGoalStateChange,
        onGoalWatchingToggle,
        onGoalStarToggle,
        goalTagsUpdate,
        goalOwnerUpdate,
        invalidate,
        onGoalCriteriaAdd,
        onGoalCriteriaToggle,
        onGoalCriteriaUpdate,
        onGoalCriteriaRemove,
        onGoalCriteriaConvert,
        resolveGoalCommentDraft,
        onGoalCommentChange,
        onGoalCommentCreate,
        onGoalCommentUpdate,
        onGoalCommentCancel,
        onGoalCommentReactionToggle,
        onGoalCommentDelete,
        onGoalParticipantAdd,
        onGoalParticipantRemove,
        onGoalDependencyAdd,
        onGoalDependencyRemove,
        lastStateComment,
        highlightCommentId,
    } = useGoalResource(
        {
            id: goal?.id,
            stateId: goal?.stateId,
            reactions: goal?.reactions,
            comments: goal?.comments,
        },
        {
            invalidate: {
                getById: id,
            },
        },
    );

    const onGoalTagAdd = useCallback(
        async (value: TagObject[]) => {
            if (!goal) return;

            await goalTagsUpdate([...goal.tags, ...value]);

            invalidate();
        },
        [goal, invalidate, goalTagsUpdate],
    );

    const onGoalTagRemove = useCallback(
        (value: TagObject) => async () => {
            if (!goal) return;

            const tags = goal.tags.filter((tag) => tag.id !== value.id);
            await goalTagsUpdate(tags);

            invalidate();
        },
        [goal, invalidate, goalTagsUpdate],
    );

    const onGoalAssigneeChange = useCallback(
        async (activity?: NonNullable<ActivityByIdReturnType>) => {
            if (!activity?.user?.activityId) return;

            await goalOwnerUpdate(activity.user.activityId);

            invalidate();
        },
        [invalidate, goalOwnerUpdate],
    );

    const onGoalDeleteConfirm = useCallback(async () => {
        onGoalDelete();
        router.goals();
    }, [onGoalDelete, router]);

    const onGoalTransfer = useCallback(
        async (project?: { id: string }) => {
            if (!project) return;

            const transferedGoal = await goalProjectChange(project.id);
            if (transferedGoal) {
                router.goal(transferedGoal._shortId);
            }
        },
        [goalProjectChange, router],
    );

    const pageTitle = tr
        .raw('title', {
            goal: goal?.title,
        })
        .join('');

    const { setPreview } = useGoalPreview();

    const onGoalCriteriaClick = useCallback(
        (item: GoalAchiveCriteria) => {
            if (item.goalAsCriteria) {
                const { projectId, scopeId, title, description, updatedAt } = item.goalAsCriteria;
                const shortId = `${projectId}-${scopeId}`;

                setPreview(shortId, {
                    title,
                    description,
                    updatedAt,
                });
            }
        },
        [setPreview],
    );

    const onGoalDependencyClick = useCallback(
        ({ projectId, scopeId, title, description, updatedAt }: GoalDependencyItem) => {
            const shortId = `${projectId}-${scopeId}`;

            setPreview(shortId, {
                title,
                description,
                updatedAt,
            });
        },
        [setPreview],
    );

    const commentDraft = resolveGoalCommentDraft(goal?.id);
    const commentsRef = useRef<HTMLDivElement>(null);
    const onCommentsClick = useCallback(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    if (!goal || !owner || !issuer) return null;

    const participantsFilter = goal.participants.map(({ id }) => id).concat([owner.id, issuer.id]);
    return (
        <Page user={user} ssrTime={ssrTime} title={pageTitle}>
            <IssueHeader>
                <StyledIssueInfo align="left">
                    {Boolean(project?.parent?.length) &&
                        nullable(project?.parent, (parent) => <IssueParent size="m" parent={parent} />)}

                    {nullable(project, (project) => (
                        <IssueParent parent={project} />
                    ))}

                    <IssueTitle title={goal.title} />

                    <StyledPublicActions>
                        {nullable(goal?.state, (s) =>
                            goal._isEditable && project?.flowId ? (
                                <StateSwitch state={s} flowId={project.flowId} onClick={onGoalStateChange} />
                            ) : (
                                <State title={s.title} hue={s.hue} />
                            ),
                        )}

                        <IssueStats
                            estimate={goal.estimate}
                            estimateType={goal.estimateType}
                            priority={goal.priority}
                            achivedCriteriaWeight={
                                goal._hasAchievementCriteria ? goal._achivedCriteriaWeight : undefined
                            }
                            comments={goal._count?.comments ?? 0}
                            onCommentsClick={onCommentsClick}
                            updatedAt={goal.updatedAt}
                        />
                    </StyledPublicActions>
                </StyledIssueInfo>

                <StyledIssueInfo align="right">
                    <PageActions>
                        <WatchButton watcher={!!goal._isWatching} onToggle={onGoalWatchingToggle} />
                        <StarButton
                            stargizer={!!goal._isStarred}
                            count={goal._count?.stargizers}
                            onToggle={onGoalStarToggle}
                        />
                    </PageActions>

                    <PageActions>
                        <IssueKey id={id} />
                        {nullable(goal._isEditable, () => (
                            <Button
                                text={tr('Edit')}
                                iconLeft={<IconEditOutline size="xs" />}
                                onClick={dispatchModalEvent(ModalEvent.GoalEditModal)}
                            />
                        ))}
                    </PageActions>
                </StyledIssueInfo>
            </IssueHeader>

            <PageSep />

            <IssueContent>
                <div>
                    <Card>
                        <StyledCardInfo>
                            <div>
                                <RelativeTime kind="Created" date={goal.createdAt} />
                            </div>
                        </StyledCardInfo>

                        <CardContent>
                            {goal.description ? (
                                <Md>{goal.description}</Md>
                            ) : (
                                <Text size="s" color={gray7} weight="thin">
                                    {tr('No description provided')}
                                </Text>
                            )}
                        </CardContent>
                    </Card>

                    {nullable(goal, ({ _activityFeed, id, goalAchiveCriteria, _relations, _isEditable }) => (
                        <GoalActivity
                            ref={commentsRef}
                            feed={_activityFeed}
                            header={
                                <>
                                    {nullable(goalAchiveCriteria.length || _isEditable, () => (
                                        <GoalCriteria
                                            goalId={id}
                                            criteriaList={goalAchiveCriteria}
                                            onAddCriteria={onGoalCriteriaAdd}
                                            onToggleCriteria={onGoalCriteriaToggle}
                                            onRemoveCriteria={onGoalCriteriaRemove}
                                            onConvertToGoal={onGoalCriteriaConvert}
                                            onUpdateCriteria={onGoalCriteriaUpdate}
                                            onClick={onGoalCriteriaClick}
                                            canEdit={_isEditable}
                                            renderTrigger={(props) =>
                                                nullable(_isEditable, () => (
                                                    <AddCriteriaForm
                                                        goalId={props.goalId}
                                                        onSubmit={props.onSubmit}
                                                        validityData={props.validityData}
                                                    />
                                                ))
                                            }
                                        />
                                    ))}

                                    {_relations.map((deps, depIdx) =>
                                        nullable(deps.goals.length || _isEditable, () => (
                                            <GoalDependencyListByKind
                                                showBeta={depIdx === 0}
                                                goalId={id}
                                                key={deps.kind}
                                                kind={deps.kind}
                                                items={deps.goals}
                                                canEdit={_isEditable}
                                                onRemove={onGoalDependencyRemove}
                                                onClick={onGoalDependencyClick}
                                            >
                                                {nullable(_isEditable, () => (
                                                    <GoalDependencyAddForm
                                                        onSubmit={onGoalDependencyAdd}
                                                        kind={deps.kind}
                                                        goalId={id}
                                                        isEmpty={deps.goals.length === 0}
                                                    />
                                                ))}
                                            </GoalDependencyListByKind>
                                        )),
                                    )}

                                    {nullable(lastStateComment, (value) => (
                                        <CommentView
                                            pin
                                            id={value.id}
                                            author={value.activity?.user}
                                            description={value.description}
                                            state={value.state}
                                            createdAt={value.createdAt}
                                            reactions={value.reactions}
                                            onSubmit={
                                                value.activity?.id === user?.activityId
                                                    ? onGoalCommentUpdate(value.id)
                                                    : undefined
                                            }
                                            onReactionToggle={onGoalCommentReactionToggle(value.id)}
                                            onDelete={onGoalCommentDelete(value.id)}
                                        />
                                    ))}
                                </>
                            }
                            footer={
                                <CommentCreateForm
                                    states={_isEditable ? project?.flow.states : undefined}
                                    stateId={commentDraft?.stateId}
                                    description={commentDraft?.description}
                                    onSubmit={onGoalCommentCreate}
                                    onCancel={onGoalCommentCancel}
                                    onChange={onGoalCommentChange}
                                />
                            }
                            renderCommentItem={(value) => (
                                <CommentView
                                    id={value.id}
                                    author={value.activity?.user}
                                    description={value.description}
                                    state={value.state}
                                    createdAt={value.createdAt}
                                    highlight={value.id === highlightCommentId}
                                    reactions={value.reactions}
                                    onSubmit={
                                        value.activity?.id === user?.activityId
                                            ? onGoalCommentUpdate(value.id)
                                            : undefined
                                    }
                                    onReactionToggle={onGoalCommentReactionToggle(value.id)}
                                    onDelete={onGoalCommentDelete(value.id)}
                                />
                            )}
                        />
                    ))}
                </div>

                <div>
                    <IssueMeta title={tr('Issuer')}>
                        <UserBadge user={issuer?.user} />
                    </IssueMeta>

                    <IssueMeta title={tr('Assignee')}>
                        {goal._isEditable ? (
                            <UserComboBox
                                placement="bottom-start"
                                placeholder={tr('Name/Email')}
                                filter={participantsFilter}
                                onChange={onGoalAssigneeChange}
                                renderTrigger={(props) => (
                                    <StyledInlineUserInput>
                                        <UserBadge user={owner?.user} />
                                        <StyledIconEditOutline size="xxs" onClick={props.onClick} />
                                    </StyledInlineUserInput>
                                )}
                            />
                        ) : (
                            <UserBadge user={owner?.user} />
                        )}
                    </IssueMeta>

                    {nullable(goal._isEditable || goal.participants.length, () => (
                        <IssueMeta title={tr('Participants')}>
                            {goal.participants?.map(({ user }) => (
                                <UserBadge
                                    key={user?.activityId}
                                    user={user}
                                    onCleanButtonClick={
                                        goal._isEditable ? onGoalParticipantRemove(user?.activityId) : undefined
                                    }
                                />
                            ))}

                            {nullable(goal._isEditable, () => (
                                <StyledInlineInput>
                                    <UserComboBox
                                        placement="bottom-start"
                                        placeholder={tr('Type user name or email')}
                                        filter={participantsFilter}
                                        onChange={onGoalParticipantAdd}
                                        renderTrigger={(props) => (
                                            <StyledInlineTrigger
                                                icon={<IconPlusCircleOutline size="xs" />}
                                                text={tr('Add participant')}
                                                onClick={props.onClick}
                                            />
                                        )}
                                    />
                                </StyledInlineInput>
                            ))}
                        </IssueMeta>
                    ))}
                    {nullable(!(!goal.tags.length && !goal._isEditable), () => (
                        <>
                            <IssueMeta title={tr('Tags')}>
                                {goal.tags?.map((tag) => (
                                    <Tag key={tag.id}>
                                        {nullable(goal._isEditable, () => (
                                            <TagCleanButton onClick={onGoalTagRemove(tag)} />
                                        ))}
                                        {tag.title}
                                    </Tag>
                                ))}
                            </IssueMeta>
                            {nullable(goal._isEditable, () => (
                                <StyledInlineInput>
                                    <TagComboBox
                                        disabled={(goal.tags || []).length >= tagsLimit}
                                        placeholder={tr('Enter tag title')}
                                        onChange={onGoalTagAdd}
                                        renderTrigger={(props) => (
                                            <StyledInlineTrigger
                                                icon={<IconPlusCircleOutline size="xs" />}
                                                text={tr('Add tag')}
                                                onClick={props.onClick}
                                            />
                                        )}
                                    />
                                </StyledInlineInput>
                            ))}
                        </>
                    ))}
                    {nullable(goal._isEditable, () => (
                        <IssueMeta>
                            <StyledInlineInput>
                                <GoalParentComboBox
                                    placement="bottom-start"
                                    placeholder={tr('Type project title')}
                                    onChange={onGoalTransfer}
                                    renderTrigger={(props) => (
                                        <StyledInlineTrigger
                                            icon={<IconArrowRightOutline size="xs" />}
                                            text={tr('Transfer goal')}
                                            onClick={props.onClick}
                                        />
                                    )}
                                />
                            </StyledInlineInput>

                            <StyledInlineInput>
                                <StyledInlineTrigger
                                    icon={<IconBinOutline size="xs" />}
                                    text={tr('Archive goal')}
                                    onClick={dispatchModalEvent(ModalEvent.GoalDeleteModal)}
                                />
                            </StyledInlineInput>
                        </IssueMeta>
                    ))}
                </div>
            </IssueContent>

            {nullable(goal._isEditable, () => (
                <ModalOnEvent event={ModalEvent.GoalEditModal} hotkeys={editGoalKeys}>
                    <GoalEditForm goal={goal} onSubmit={dispatchModalEvent(ModalEvent.GoalEditModal)} />
                </ModalOnEvent>
            ))}

            {nullable(goal._isEditable, () => (
                <GoalDeleteModal shortId={goal._shortId} onConfirm={onGoalDeleteConfirm} />
            ))}
            <ModalOnEvent event={ModalEvent.ImageFullScreen}>
                <ModalContext.Consumer>
                    {(ctx) => <ImageFullScreen {...ctx[ModalEvent.ImageFullScreen]} />}
                </ModalContext.Consumer>
            </ModalOnEvent>
        </Page>
    );
};
