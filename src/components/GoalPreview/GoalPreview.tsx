import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import { danger0, gapM, gapS, gray7 } from '@taskany/colors';
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
    nullable,
    Text,
} from '@taskany/bricks';

import { routes } from '../../hooks/router';
import { usePageContext } from '../../hooks/usePageContext';
import { useReactionsResource } from '../../hooks/useReactionsResource';
import { useCriteriaResource } from '../../hooks/useCriteriaResource';
import { useCommentResource } from '../../hooks/useCommentResource';
import { useHighlightedComment } from '../../hooks/useHighlightedComment';
import { useDateViewType } from '../../hooks/useDateViewType';
import { useLSDraft } from '../../hooks/useLSDraft';
import { useGoalDependencyResource } from '../../hooks/useGoalDependencyResource';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { editGoalKeys } from '../../utils/hotkeys';
import { IssueTitle } from '../IssueTitle';
import { IssueParent } from '../IssueParent';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { IssueStats } from '../IssueStats/IssueStats';
import { GoalDeleteModal } from '../GoalDeleteModal/GoalDeleteModal';
import { trpc } from '../../utils/trpcClient';
import { notifyPromise } from '../../utils/notifyPromise';
import { GoalStateChangeSchema } from '../../schema/goal';
import { GoalActivity } from '../GoalActivity';
import { GoalCriteria } from '../GoalCriteria/GoalCriteria';
import { State } from '../State';
import { GoalDependencyAddForm } from '../GoalDependencyForm/GoalDependencyForm';
import { GoalDependencyListByKind } from '../GoalDependencyList/GoalDependencyList';
import { CommentView } from '../CommentView/CommentView';

import { tr } from './GoalPreview.i18n';
import { useGoalPreview } from './GoalPreviewProvider';

const Md = dynamic(() => import('../Md'));
const StateSwitch = dynamic(() => import('../StateSwitch'));
const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const GoalEditForm = dynamic(() => import('../GoalEditForm/GoalEditForm'));
const CommentCreateForm = dynamic(() => import('../CommentCreateForm/CommentCreateForm'));

interface GoalPreviewProps {
    shortId: string;
    goal: GoalByIdReturnType;
    defaults: Partial<NonNullable<GoalByIdReturnType>>;
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
    top: 0;
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

export const GoalPreviewModal: React.FC<GoalPreviewProps> = ({ shortId, onClose, onDelete, goal, defaults }) => {
    const { user } = usePageContext();
    const { isRelative, onDateViewTypeChange } = useDateViewType();

    // --------------------------------------------------------------------------- goal actions
    const archiveMutation = trpc.goal.toggleArchive.useMutation();
    const utils = trpc.useContext();

    const invalidateFn = useCallback(() => {
        return utils.goal.getById.invalidate(shortId);
    }, [utils.goal.getById, shortId]);

    const [goalEditModalVisible, setGoalEditModalVisible] = useState(false);

    const onGoalEdit = useCallback(() => {
        setGoalEditModalVisible(false);

        invalidateFn();
    }, [invalidateFn]);

    const onGoalEditModalShow = useCallback(() => {
        setGoalEditModalVisible(true);
    }, []);

    const onGoalEditModalClose = useCallback(() => {
        setGoalEditModalVisible(false);
    }, []);

    const stateChangeMutations = trpc.goal.switchState.useMutation();
    const onGoalStateChange = useCallback(
        async (nextState: GoalStateChangeSchema['state']) => {
            if (goal?.id) {
                await stateChangeMutations.mutateAsync({
                    id: goal.id,
                    state: nextState,
                });
            }

            invalidateFn();
        },
        [goal, invalidateFn, stateChangeMutations],
    );

    const onPreviewClose = useCallback(() => {
        setGoalEditModalVisible(false);
        onClose?.();
    }, [onClose]);

    const onEditMenuChange = useCallback((item: { onClick: () => void }) => {
        item.onClick?.();
    }, []);

    const onGoalDeleteConfirm = useCallback(async () => {
        if (!goal?.id) {
            return;
        }

        onDelete?.();
        const promise = archiveMutation.mutateAsync({
            id: goal.id,
            archived: true,
        });

        await notifyPromise(promise, 'goalsDelete');

        invalidateFn();
    }, [onDelete, archiveMutation, goal, invalidateFn]);

    const criteria = useCriteriaResource(invalidateFn);
    const dependency = useGoalDependencyResource(invalidateFn);

    const { title, description, updatedAt } = goal || defaults;
    const goalEditMenuItems = useMemo(
        () => [
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
        ],
        [],
    );

    // --------------------------------------------------------------------------- comments actions
    const {
        saveDraft: saveCommentDraft,
        resolveDraft: resolveCommentDraft,
        removeDraft: removeCommentDraft,
    } = useLSDraft('draftGoalComment', {});
    const commentDraft = resolveCommentDraft(goal?.id);
    const { highlightCommentId, setHighlightCommentId } = useHighlightedComment();
    const { create: createComment, update: updateComment, remove: removeComment } = useCommentResource();
    const { commentReaction } = useReactionsResource(goal?.reactions);

    const onCommentChange = useCallback(
        (comment?: { stateId?: string; description?: string }) => {
            if (goal?.id) {
                if (!comment?.description) {
                    removeCommentDraft(goal.id);
                    return;
                }

                saveCommentDraft(goal?.id, comment);
            }
        },
        [goal?.id, removeCommentDraft, saveCommentDraft],
    );

    const onCommentCreate = useCallback(
        async (comment?: { description: string; stateId?: string }) => {
            if (comment && goal?.id) {
                await createComment(({ id }) => {
                    invalidateFn();
                    removeCommentDraft(goal.id);
                    setHighlightCommentId(id);
                })({
                    ...comment,
                    goalId: goal?.id,
                });
            }
        },
        [goal?.id, invalidateFn, removeCommentDraft, setHighlightCommentId, createComment],
    );

    const onCommentUpdate = useCallback(
        (id: string) => async (comment?: { description: string }) => {
            if (comment && goal?.id) {
                await updateComment(() => {
                    invalidateFn();
                })({
                    ...comment,
                    id,
                });
            }
        },
        [goal?.id, invalidateFn, updateComment],
    );

    const onCommentCancel = useCallback(() => {
        if (goal?.id) {
            removeCommentDraft(goal?.id);
        }
    }, [removeCommentDraft, goal?.id]);

    const onCommentReactionToggle = useCallback(
        (id: string) => commentReaction(id, () => utils.goal.getById.invalidate(shortId)),
        [shortId, commentReaction, utils.goal.getById],
    );

    const onCommentDelete = useCallback(
        (id: string) => () => {
            removeComment(() => {
                invalidateFn();
            })({ id });
        },
        [invalidateFn, removeComment],
    );

    const commentsRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const onCommentsClick = useCallback(() => {
        commentsRef.current &&
            contentRef.current &&
            headerRef.current &&
            contentRef.current.scrollTo({
                behavior: 'smooth',
                top: commentsRef.current.offsetTop - headerRef.current.offsetHeight,
            });
    }, []);

    const lastChangedStatusComment = useMemo(() => {
        if (!goal || goal.comments.length <= 1) {
            return null;
        }

        const foundResult = goal.comments.findLast((comment) => comment.stateId);
        return foundResult?.stateId === goal.stateId ? foundResult : null;
    }, [goal]);

    return (
        <>
            <ModalPreview visible onClose={onPreviewClose}>
                <StyledModalHeader ref={headerRef}>
                    {Boolean(goal?.project?.parent?.length) &&
                        nullable(goal?.project?.parent, (parent) => (
                            <>
                                <IssueParent as="span" mode="compact" parent={parent} size="m" />
                                <Dot />
                            </>
                        ))}

                    {nullable(goal?.project, (project) => (
                        <IssueParent as="span" mode="compact" parent={project} size="m" />
                    ))}

                    {nullable(title, (t) => (
                        <IssueTitle title={t} href={routes.goal(shortId)} size="xl" />
                    ))}

                    <StyledImportantActions>
                        <StyledPublicActions>
                            {nullable(goal?.state, (s) =>
                                goal?._isEditable && goal.project?.flowId ? (
                                    <StateSwitch state={s} flowId={goal.project?.flowId} onClick={onGoalStateChange} />
                                ) : (
                                    <State title={s.title} hue={s.hue} />
                                ),
                            )}

                            {nullable(updatedAt, (u) => (
                                <IssueStats
                                    mode="compact"
                                    issuer={goal?.activity}
                                    owner={goal?.owner}
                                    estimate={goal?._lastEstimate}
                                    priority={goal?.priority}
                                    achivedCriteriaWeight={goal?._achivedCriteriaWeight}
                                    comments={goal?._count?.comments ?? 0}
                                    onCommentsClick={onCommentsClick}
                                    updatedAt={u}
                                />
                            ))}
                        </StyledPublicActions>

                        {nullable(goal?._isEditable, () => (
                            <Dropdown
                                onChange={onEditMenuChange}
                                items={goalEditMenuItems}
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
                <StyledModalContent ref={contentRef}>
                    <StyledCard>
                        <CardInfo onClick={onDateViewTypeChange}>
                            <Link inline>{goal?.activity?.user?.name}</Link> —{' '}
                            {nullable(goal?.createdAt, (date) => (
                                <RelativeTime isRelativeTime={isRelative} date={date} />
                            ))}
                        </CardInfo>

                        <CardComment>
                            {description ? (
                                <Md>{description}</Md>
                            ) : (
                                <Text size="s" color={gray7} weight="thin">
                                    {tr('No description provided')}
                                </Text>
                            )}
                        </CardComment>
                    </StyledCard>

                    {nullable(goal, ({ _activityFeed, id, goalAchiveCriteria, _relations, project, _isEditable }) => (
                        <GoalActivity
                            ref={commentsRef}
                            feed={_activityFeed}
                            header={
                                <>
                                    {nullable(lastChangedStatusComment, (value) => (
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
                                    {nullable(goalAchiveCriteria.length || _isEditable, () => (
                                        <GoalCriteria
                                            goalId={id}
                                            criteriaList={goalAchiveCriteria}
                                            onAddCriteria={criteria.onAddHandler}
                                            onToggleCriteria={criteria.onToggleHandler}
                                            onRemoveCriteria={criteria.onRemoveHandler}
                                            onConvertToGoal={criteria.onConvertCriteria}
                                            onUpdateCriteria={criteria.onUpdateHandler}
                                            canEdit={_isEditable}
                                        />
                                    ))}

                                    {_relations.map((deps) =>
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
                                                        isEmpty={deps.goals.length === 0}
                                                    />
                                                ))}
                                            </GoalDependencyListByKind>
                                        )),
                                    )}
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
                        ></GoalActivity>
                    ))}
                </StyledModalContent>
            </ModalPreview>

            {nullable(goal, (g) =>
                nullable(g._isEditable, () => (
                    <>
                        <ModalOnEvent
                            event={ModalEvent.GoalEditModal}
                            hotkeys={editGoalKeys}
                            visible={goalEditModalVisible}
                            onShow={onGoalEditModalShow}
                            onClose={onGoalEditModalClose}
                        >
                            <GoalEditForm goal={g} onSubmit={onGoalEdit} />
                        </ModalOnEvent>

                        <GoalDeleteModal shortId={g._shortId} onConfirm={onGoalDeleteConfirm} />
                    </>
                )),
            )}
        </>
    );
};

export const GoalPreview: FC = () => {
    const { setPreview, shortId, preview, defaults } = useGoalPreview();

    const onPreviewDestroy = useCallback(() => {
        setPreview(null);
    }, [setPreview]);

    return nullable(shortId, (id) => (
        <GoalPreviewModal
            shortId={id}
            goal={preview}
            defaults={defaults || {}}
            onClose={onPreviewDestroy}
            onDelete={onPreviewDestroy}
        />
    ));
};
