import React, { FC, useCallback, useMemo, useRef } from 'react';
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
    MenuItem,
    ModalContent,
    ModalHeader,
    ModalPreview,
    nullable,
    Text,
} from '@taskany/bricks';
import { IconMoreVerticalOutline, IconBinOutline, IconEditOutline } from '@taskany/icons';

import { routes } from '../../hooks/router';
import { usePageContext } from '../../hooks/usePageContext';
import { useClickSwitch } from '../../hooks/useClickSwitch';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { editGoalKeys } from '../../utils/hotkeys';
import { IssueTitle } from '../IssueTitle';
import { IssueParent } from '../IssueParent';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { IssueStats } from '../IssueStats/IssueStats';
import { GoalDeleteModal } from '../GoalDeleteModal/GoalDeleteModal';
import { GoalActivity } from '../GoalActivity';
import { GoalCriteria } from '../GoalCriteria/GoalCriteria';
import { State } from '../State';
import { GoalDependencyAddForm } from '../GoalDependencyForm/GoalDependencyForm';
import { GoalDependencyListByKind } from '../GoalDependencyList/GoalDependencyList';
import { CommentView } from '../CommentView/CommentView';
import { ModalContext } from '../ModalOnEvent';
import { AddCriteriaForm } from '../CriteriaForm/CriteriaForm';
import { useGoalResource } from '../../hooks/useGoalResource';

import { useGoalPreview } from './GoalPreviewProvider';
import { tr } from './GoalPreview.i18n';

const Md = dynamic(() => import('../Md'));
const StateSwitch = dynamic(() => import('../StateSwitch'));
const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const GoalEditForm = dynamic(() => import('../GoalEditForm/GoalEditForm'));
const CommentCreateForm = dynamic(() => import('../CommentCreateForm/CommentCreateForm'));
const ImageFullScreen = dynamic(() => import('../ImageFullScreen'));

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

const GoalPreviewModal: React.FC<GoalPreviewProps> = ({ shortId, goal, defaults, onClose, onDelete }) => {
    const { user } = usePageContext();
    const [isRelative, onDateViewTypeChange] = useClickSwitch();

    const onPreviewClose = useCallback(() => {
        onClose?.();
    }, [onClose]);

    const onEditMenuChange = useCallback((item: { onClick: () => void }) => {
        item.onClick?.();
    }, []);

    const {
        onGoalDelete,
        onGoalStateChange,
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
                getById: shortId,
            },
        },
    );

    const onGoalDeleteConfirm = useCallback(() => {
        onDelete?.();
        onGoalDelete();
    }, [onDelete, onGoalDelete]);

    const { title, description, updatedAt } = goal || defaults;
    const goalEditMenuItems = useMemo(
        () => [
            {
                label: tr('Edit'),
                icon: <IconEditOutline size="xxs" />,
                onClick: dispatchModalEvent(ModalEvent.GoalEditModal),
            },
            {
                label: tr('Delete'),
                color: danger0,
                icon: <IconBinOutline size="xxs" />,
                onClick: dispatchModalEvent(ModalEvent.GoalDeleteModal),
            },
        ],
        [],
    );

    const commentDraft = resolveGoalCommentDraft(goal?.id);
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
                                    estimate={goal?.estimate}
                                    estimateType={goal?.estimateType}
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
                                        iconLeft={<IconMoreVerticalOutline noWrap size="xs" />}
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
                                    {nullable(goalAchiveCriteria.length || _isEditable, () => (
                                        <GoalCriteria
                                            goalId={id}
                                            criteriaList={goalAchiveCriteria}
                                            onAddCriteria={onGoalCriteriaAdd}
                                            onToggleCriteria={onGoalCriteriaToggle}
                                            onRemoveCriteria={onGoalCriteriaRemove}
                                            onConvertToGoal={onGoalCriteriaConvert}
                                            onUpdateCriteria={onGoalCriteriaUpdate}
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

                                    {_relations.map((deps) =>
                                        nullable(deps.goals.length || _isEditable, () => (
                                            <GoalDependencyListByKind
                                                goalId={id}
                                                key={deps.kind}
                                                kind={deps.kind}
                                                items={deps.goals}
                                                canEdit={_isEditable}
                                                onRemove={onGoalDependencyRemove}
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
                </StyledModalContent>
            </ModalPreview>

            {nullable(goal, (g) =>
                nullable(g._isEditable, () => (
                    <>
                        <ModalOnEvent event={ModalEvent.GoalEditModal} hotkeys={editGoalKeys}>
                            <GoalEditForm goal={g} onSubmit={dispatchModalEvent(ModalEvent.GoalEditModal)} />
                        </ModalOnEvent>

                        <GoalDeleteModal shortId={g._shortId} onConfirm={onGoalDeleteConfirm} />
                    </>
                )),
            )}

            <ModalOnEvent event={ModalEvent.ImageFullScreen}>
                <ModalContext.Consumer>
                    {(ctx) => <ImageFullScreen {...ctx[ModalEvent.ImageFullScreen]} />}
                </ModalContext.Consumer>
            </ModalOnEvent>
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

export default GoalPreview;
