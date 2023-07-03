/* eslint-disable prefer-destructuring */
import React, { useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import { gapM, gray7 } from '@taskany/colors';
import {
    Button,
    Card,
    CardInfo,
    CardContent,
    EditIcon,
    BinIcon,
    nullable,
    Text,
    PlusIcon,
    ArrowRightIcon,
} from '@taskany/bricks';

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
import { useReactionsResource } from '../../hooks/useReactionsResource';
import { WatchButton } from '../WatchButton/WatchButton';
import { useGoalResource } from '../../hooks/useGoalResource';
import { StarButton } from '../StarButton/StarButton';
import { useRouter } from '../../hooks/router';
import { GoalDeleteModal } from '../GoalDeleteModal/GoalDeleteModal';
import { trpc } from '../../utils/trpcClient';
import { GoalStateChangeSchema, ToggleGoalDependency } from '../../schema/goal';
import { refreshInterval } from '../../utils/config';
import { notifyPromise } from '../../utils/notifyPromise';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { GoalActivity } from '../GoalActivity';
import { CriteriaForm } from '../CriteriaForm/CriteriaForm';
import { GoalCriteria } from '../GoalCriteria/GoalCriteria';
import { useCriteriaResource } from '../../hooks/useCriteriaResource';
import { useGoalDependencyResource } from '../../hooks/useGoalDependencyResource';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { IssueMeta } from '../IssueMeta';
import { UserBadge } from '../UserBadge';
import { InlineTrigger } from '../InlineTrigger';
import { UserComboBox } from '../UserComboBox';
import { State } from '../State';
import { GoalParentComboBox } from '../GoalParentComboBox';
import { GoalDependencyListByKind } from '../GoalDependencyList/GoalDependencyList';
import { GoalDependencyAddForm } from '../GoalDependencyForm/GoalDependencyForm';

import { tr } from './GoalPage.i18n';

const StateSwitch = dynamic(() => import('../StateSwitch'));
const Md = dynamic(() => import('../Md'));
const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const GoalEditForm = dynamic(() => import('../GoalEditForm/GoalEditForm'));

const IssueHeader = styled(PageContent)`
    display: grid;
    grid-template-columns: 8fr 4fr;
`;

const IssueContent = styled(PageContent)`
    display: grid;
    grid-template-columns: 7fr 5fr;
    gap: ${gapM};
`;

const StyledCard = styled(Card)`
    min-height: auto; // FIXME: https://github.com/taskany-inc/bricks/issues/211
`;

const StyledCardContent = styled(CardContent)`
    padding-bottom: 12px; // FIXME: https://github.com/taskany-inc/bricks/issues/211
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

export const GoalPage = ({ user, ssrTime, params: { id } }: ExternalPageProps<{ id: string }>) => {
    const router = useRouter();

    const utils = trpc.useContext();

    const { data: goal } = trpc.goal.getById.useQuery(id, {
        staleTime: refreshInterval,
    });

    const { project, activity: issuer, owner } = goal || {};

    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);
    useEffect(() => {
        project && setCurrentProjectCache(project);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const { toggleGoalWatching, toggleGoalStar } = useGoalResource(goal?.id, goal?._shortId);

    const { commentReaction } = useReactionsResource(goal?.reactions);

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

    const addParticipantMutation = trpc.goal.addParticipant.useMutation();
    const onParticipantAdd = useCallback(
        async ({ id: activityId }: ActivityByIdReturnType) => {
            if (goal && activityId) {
                await addParticipantMutation.mutateAsync({ id: goal.id, activityId });
                invalidateFn();
            }
        },
        [goal, invalidateFn, addParticipantMutation],
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

    const onCommentPublish = useCallback(() => {
        invalidateFn();
    }, [invalidateFn]);

    const onCommentReactionToggle = useCallback(
        (id: string) => commentReaction(id, () => utils.goal.getById.invalidate(id)),
        [commentReaction, utils.goal.getById],
    );
    const onCommentDelete = useCallback(() => {
        invalidateFn();
    }, [invalidateFn]);

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
        async ({ id: projectId }: { id: string }) => {
            if (goal) {
                const promise = changeProjectMutation.mutateAsync({
                    id: goal?.id,
                    projectId,
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

    const commentsRef = useRef<HTMLDivElement>(null);
    const onCommentsClick = useCallback(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const criteria = useCriteriaResource(invalidateFn);
    const dependency = useGoalDependencyResource(invalidateFn);

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

                    {nullable(goal.state, (s) =>
                        goal._isEditable ? (
                            <StateSwitch state={s} flowId={project?.flowId} onClick={onGoalStateChange} />
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
                                iconLeft={<EditIcon noWrap size="xs" />}
                                onClick={dispatchModalEvent(ModalEvent.GoalEditModal)}
                            />
                        ))}
                    </PageActions>
                </StyledIssueInfo>
            </IssueHeader>

            <PageSep />

            <IssueContent>
                <div>
                    <StyledCard>
                        <StyledCardInfo>
                            <div>
                                <RelativeTime kind="Created" date={goal.createdAt} />
                            </div>
                        </StyledCardInfo>

                        <StyledCardContent>
                            {goal.description ? (
                                <Md>{goal.description}</Md>
                            ) : (
                                <Text size="s" color={gray7} weight="thin">
                                    {tr('No description provided')}
                                </Text>
                            )}
                        </StyledCardContent>
                    </StyledCard>

                    {nullable(goal, ({ activityFeed, id, goalAchiveCriteria, relations, _isEditable }) => (
                        <GoalActivity
                            feed={activityFeed}
                            ref={commentsRef}
                            userId={user.activityId}
                            goalId={id}
                            onCommentReaction={onCommentReactionToggle}
                            onCommentPublish={onCommentPublish}
                            onCommentDelete={onCommentDelete}
                            goalStates={_isEditable ? project?.flow.states : undefined}
                        >
                            {nullable(goalAchiveCriteria.length || _isEditable, () => (
                                <GoalCriteria
                                    goalId={id}
                                    criteriaList={goalAchiveCriteria}
                                    onAddCriteria={criteria.onAddHandler}
                                    onToggleCriteria={criteria.onToggleHandler}
                                    onRemoveCriteria={criteria.onRemoveHandler}
                                    canEdit={_isEditable}
                                    renderForm={(props) =>
                                        nullable(_isEditable, () => (
                                            <CriteriaForm
                                                onSubmit={props.onAddCriteria}
                                                goalId={id}
                                                validityData={props.dataForValidateCriteria}
                                            />
                                        ))
                                    }
                                />
                            ))}

                            <>
                                {relations.map((deps) =>
                                    nullable(deps.goals.length || _isEditable, () => (
                                        <GoalDependencyListByKind
                                            goalId={id}
                                            key={deps.kind}
                                            kind={deps.kind}
                                            items={deps.goals}
                                            canEdit={_isEditable}
                                            onRemove={dependency.onRemoveHandler}
                                        >
                                            {nullable(_isEditable, () => (
                                                <GoalDependencyAddForm
                                                    onSubmit={dependency.onAddHandler}
                                                    kind={deps.kind}
                                                    goalId={id}
                                                />
                                            ))}
                                        </GoalDependencyListByKind>
                                    )),
                                )}
                            </>
                        </GoalActivity>
                    ))}
                </div>

                <div>
                    <IssueMeta title={tr('Issuer')}>
                        <UserBadge user={issuer?.user} />
                    </IssueMeta>

                    <IssueMeta title={tr('Assignee')}>
                        <UserBadge user={owner?.user} />
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
                                            // FIXME: https://github.com/taskany-inc/bricks/issues/210
                                            ref={props.ref as any as React.RefObject<HTMLDivElement>}
                                            icon={<PlusIcon noWrap size="xs" />}
                                            text={tr('Add participant')}
                                            onClick={props.onClick}
                                        />
                                    )}
                                />
                            </StyledInlineInput>
                        ))}
                    </IssueMeta>

                    {nullable(goal._isEditable, () => (
                        <IssueMeta>
                            <StyledInlineInput>
                                <GoalParentComboBox
                                    placement="bottom-start"
                                    placeholder={tr('Type project title')}
                                    onChange={onGoalTransfer}
                                    renderTrigger={(props) => (
                                        <StyledInlineTrigger
                                            // FIXME: https://github.com/taskany-inc/bricks/issues/210
                                            ref={props.ref as any as React.RefObject<HTMLDivElement>}
                                            icon={<ArrowRightIcon noWrap size="xs" />}
                                            text={tr('Transfer goal')}
                                            onClick={props.onClick}
                                        />
                                    )}
                                />
                            </StyledInlineInput>

                            <StyledInlineInput>
                                <StyledInlineTrigger
                                    icon={<BinIcon noWrap size="xs" />}
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
        </Page>
    );
};
