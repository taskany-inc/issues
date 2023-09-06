/* eslint-disable prefer-destructuring */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import { gapM, gray7 } from '@taskany/colors';
import { Button, Card, CardInfo, CardContent, nullable, Text, Tag } from '@taskany/bricks';
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
import { useGoalCommentsActions } from '../../hooks/useGoalCommentsActions';
import { useCriteriaResource } from '../../hooks/useCriteriaResource';
import { useGoalDependencyResource } from '../../hooks/useGoalDependencyResource';
import { useRouter } from '../../hooks/router';
import { StarButton } from '../StarButton/StarButton';
import { GoalDeleteModal } from '../GoalDeleteModal/GoalDeleteModal';
import { trpc } from '../../utils/trpcClient';
import { GoalStateChangeSchema, GoalUpdate } from '../../schema/goal';
import { refreshInterval } from '../../utils/config';
import { notifyPromise } from '../../utils/notifyPromise';
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
import { useGoalUpdate } from '../../hooks/useGoalUpdate';
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

interface TagObject {
    id: string;
    title: string;
    description?: string | null;
}

const tagsLimit = 5;

export const GoalPage = ({ user, ssrTime, params: { id } }: ExternalPageProps<{ id: string }>) => {
    const router = useRouter();

    const utils = trpc.useContext();

    const { data: goal } = trpc.goal.getById.useQuery(id, {
        staleTime: refreshInterval,
    });

    useFMPMetric(!!goal);

    const { project, activity: issuer, owner } = goal || {};

    const [currentOwner, setCurrentOwner] = useState(owner?.user);

    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);
    useEffect(() => {
        project && setCurrentProjectCache(project);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const { toggleGoalWatching, toggleGoalStar } = useGoalResource(goal?.id, goal?._shortId);

    const invalidateFn = useCallback(() => {
        return utils.goal.getById.invalidate(id);
    }, [id, utils.goal.getById]);

    const stateMutation = trpc.goal.switchState.useMutation();
    const onGoalStateChange = useCallback(
        async (nextState: GoalStateChangeSchema['state']) => {
            if (goal) {
                await stateMutation.mutateAsync({
                    state: nextState,
                    id: goal.id,
                });
                invalidateFn();
            }
        },
        [goal, invalidateFn, stateMutation],
    );
    const update = useGoalUpdate(goal?.id);
    const onTagAdd = useCallback(
        async (value: TagObject[]) => {
            if (goal) {
                await update({
                    ...goal,
                    tags: [...goal.tags, ...value],
                    state: {
                        id: goal.state?.id || '',
                        hue: goal.state?.hue,
                        title: goal.state?.title,
                        type: goal.state?.type || 'NotStarted',
                    },
                    parent: {
                        id: goal.project?.id || '',
                        title: goal.project?.title || '',
                        flowId: goal.project?.flowId || '',
                    },
                    owner: {
                        id: goal.owner?.id || '',
                        user: {
                            nickname: goal.owner?.user?.nickname || null,
                            name: goal.owner?.user?.name || null,
                            email: goal.owner?.user?.email || '',
                        },
                    },
                    estimate: goal.estimate[0]?.estimate,
                });
                invalidateFn();
            }
        },
        [goal, invalidateFn, update],
    );

    const addParticipantMutation = trpc.goal.addParticipant.useMutation();
    const onParticipantAdd = useCallback(
        async (activity?: ActivityByIdReturnType) => {
            if (activity && goal) {
                await addParticipantMutation.mutateAsync({ id: goal.id, activityId: activity.id });
                invalidateFn();
            }
        },
        [goal, invalidateFn, addParticipantMutation],
    );

    const onAssigneeChange = useCallback(
        async (activity?: ActivityByIdReturnType) => {
            if (goal && activity?.user && goal.project) {
                setCurrentOwner(activity.user);
                try {
                    await update({
                        ...(goal as unknown as GoalUpdate),
                        owner: {
                            id: activity.id,
                            user: {
                                ...activity.user,
                            },
                        },
                        // Need to pad fields due to zod validation
                        parent: goal.project,
                        estimate: goal._lastEstimate,
                    });
                    invalidateFn();
                } catch (error: any) {
                    setCurrentOwner(currentOwner);
                }
            }
        },
        [currentOwner, goal, invalidateFn, update],
    );

    const removeParticipantMutation = trpc.goal.removeParticipant.useMutation();
    const onParticipantRemove = useCallback(
        (activityId?: string | null) => async () => {
            if (goal && activityId) {
                await removeParticipantMutation.mutateAsync({ id: goal.id, activityId });
                invalidateFn();
            }
        },
        [goal, invalidateFn, removeParticipantMutation],
    );

    const onGoalEdit = useCallback(() => {
        dispatchModalEvent(ModalEvent.GoalEditModal)();
        invalidateFn();
    }, [invalidateFn]);

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

    const changeProjectMutation = trpc.goal.changeProject.useMutation();
    const onGoalTransfer = useCallback(
        async (project?: { id: string }) => {
            if (project && goal) {
                const promise = changeProjectMutation.mutateAsync({
                    id: goal?.id,
                    projectId: project.id,
                });

                await notifyPromise(promise, 'goalsUpdate');

                const transferedGoal = await promise;

                if (transferedGoal) router.goal(transferedGoal._shortId);
            }
        },
        [goal, changeProjectMutation, router],
    );

    const pageTitle = tr
        .raw('title', {
            goal: goal?.title,
        })
        .join('');

    const criteria = useCriteriaResource(invalidateFn);
    const dependency = useGoalDependencyResource(invalidateFn);

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

    const {
        highlightCommentId,
        lastStateComment,
        resolveCommentDraft,
        onCommentChange,
        onCommentCreate,
        onCommentUpdate,
        onCommentDelete,
        onCommentCancel,
        onCommentReactionToggle,
    } = useGoalCommentsActions({
        id: goal?.id,
        shortId: goal?._shortId,
        stateId: goal?.stateId,
        reactions: goal?.reactions,
        comments: goal?.comments,
        cb: invalidateFn,
    });

    const commentDraft = resolveCommentDraft();
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

                    {nullable(goal?.state, (s) =>
                        goal._isEditable && project?.flowId ? (
                            <StateSwitch state={s} flowId={project.flowId} onClick={onGoalStateChange} />
                        ) : (
                            <State title={s.title} hue={s.hue} />
                        ),
                    )}

                    <IssueStats
                        estimate={goal._lastEstimate}
                        priority={goal.priority}
                        achivedCriteriaWeight={goal._hasAchievementCriteria ? goal._achivedCriteriaWeight : undefined}
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

                    <PageActions>
                        <IssueKey id={id} />
                        {nullable(goal._isEditable, () => (
                            <Button
                                text={tr('Edit')}
                                iconLeft={<IconEditOutline noWrap size="xs" />}
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
                                            onAddCriteria={criteria.onAddHandler}
                                            onToggleCriteria={criteria.onToggleHandler}
                                            onRemoveCriteria={criteria.onRemoveHandler}
                                            onConvertToGoal={criteria.onConvertCriteria}
                                            onClick={onGoalCriteriaClick}
                                            onUpdateCriteria={criteria.onUpdateHandler}
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
                                                onRemove={dependency.onRemoveHandler}
                                                onClick={onGoalDependencyClick}
                                            >
                                                {nullable(_isEditable, () => (
                                                    <GoalDependencyAddForm
                                                        onSubmit={dependency.onAddHandler}
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
                                                    ? onCommentUpdate(value.id)
                                                    : undefined
                                            }
                                            onReactionToggle={onCommentReactionToggle(value.id)}
                                            onDelete={onCommentDelete(value.id)}
                                        />
                                    ))}
                                </>
                            }
                            footer={
                                <CommentCreateForm
                                    states={_isEditable ? project?.flow.states : undefined}
                                    stateId={commentDraft?.stateId}
                                    description={commentDraft?.description}
                                    onSubmit={onCommentCreate}
                                    onCancel={onCommentCancel}
                                    onChange={onCommentChange}
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
                                        value.activity?.id === user?.activityId ? onCommentUpdate(value.id) : undefined
                                    }
                                    onReactionToggle={onCommentReactionToggle(value.id)}
                                    onDelete={onCommentDelete(value.id)}
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
                            <StyledInlineInput>
                                <UserComboBox
                                    placement="bottom-start"
                                    placeholder={tr('Name/Email')}
                                    filter={participantsFilter}
                                    onChange={onAssigneeChange}
                                    renderTrigger={(props) => (
                                        <StyledInlineInput>
                                            <UserBadge user={currentOwner} />
                                            <IconEditOutline noWrap size="xs" onClick={props.onClick} />
                                        </StyledInlineInput>
                                    )}
                                />
                            </StyledInlineInput>
                        ) : (
                            <UserBadge user={owner?.user} />
                        )}
                    </IssueMeta>

                    <IssueMeta title={tr('Participants')}>
                        {goal.participants?.map(({ user }) => (
                            <UserBadge
                                key={user?.activityId}
                                user={user}
                                onCleanButtonClick={
                                    goal._isEditable ? onParticipantRemove(user?.activityId) : undefined
                                }
                            />
                        ))}

                        {nullable(goal._isEditable, () => (
                            <StyledInlineInput>
                                <UserComboBox
                                    placement="bottom-start"
                                    placeholder={tr('Type user name or email')}
                                    filter={participantsFilter}
                                    onChange={onParticipantAdd}
                                    renderTrigger={(props) => (
                                        <StyledInlineTrigger
                                            icon={<IconPlusCircleOutline noWrap size="xs" />}
                                            text={tr('Add participant')}
                                            onClick={props.onClick}
                                        />
                                    )}
                                />
                            </StyledInlineInput>
                        ))}
                    </IssueMeta>
                    {nullable(!(!goal.tags.length && !goal._isEditable), () => (
                        <>
                            <IssueMeta title={tr('Tags')}>
                                {goal.tags?.map((tag) => (
                                    <Tag key={tag.id}>{tag.title}</Tag>
                                ))}
                            </IssueMeta>
                            {nullable(goal._isEditable, () => (
                                <StyledInlineInput>
                                    <TagComboBox
                                        disabled={(goal.tags || []).length >= tagsLimit}
                                        placeholder={tr('Enter tag title')}
                                        onChange={onTagAdd}
                                        renderTrigger={(props) => (
                                            <StyledInlineTrigger
                                                icon={<IconPlusCircleOutline noWrap size="xs" />}
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
                                            icon={<IconArrowRightOutline noWrap size="xs" />}
                                            text={tr('Transfer goal')}
                                            onClick={props.onClick}
                                        />
                                    )}
                                />
                            </StyledInlineInput>

                            <StyledInlineInput>
                                <StyledInlineTrigger
                                    icon={<IconBinOutline noWrap size="xs" />}
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
                    <GoalEditForm goal={goal} onSubmit={onGoalEdit} />
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
