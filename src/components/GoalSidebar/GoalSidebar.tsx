import { ComponentProps, FC, useCallback, useMemo } from 'react';
import { nullable } from '@taskany/bricks';
import { Tag, TagCleanButton } from '@taskany/bricks/harmony';
import { IconArrowRightOutline, IconBinOutline, IconLayersSubtractOutline, IconXCircleSolid } from '@taskany/icons';

import { IssueMeta } from '../IssueMeta/IssueMeta';
import { UserBadge } from '../UserBadge/UserBadge';
import { TagComboBox } from '../TagComboBox/TagComboBox';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { GoalByIdReturnType, GoalChangeProjectReturnType } from '../../../trpc/inferredTypes';
import { useGoalResource } from '../../hooks/useGoalResource';
import { ProjectBadge } from '../ProjectBadge';
import { safeUserData } from '../../utils/getUserName';
import {
    goalDependencies,
    goalDependenciesTrigger,
    goalDependencyGoalsListItem,
    goalDependencyKinds,
    goalPageDeleteButton,
} from '../../utils/domObjects';
import { dispatchPreviewUpdateEvent } from '../GoalPreview/GoalPreviewProvider';
import { GoalList } from '../GoalList/GoalList';
import { GoalFormPopupTrigger } from '../GoalFormPopupTrigger/GoalFormPopupTrigger';
import { GoalDependency } from '../GoalDependency/GoalDependency';
import { TagsList } from '../TagsList/TagsList';
import { dependencyKind } from '../../schema/goal';
import { UserEditableList } from '../UserEditableList/UserEditableList';
import { GoalCriteriaSuggest } from '../GoalCriteriaSuggest';
import { AddInlineTrigger } from '../AddInlineTrigger/AddInlineTrigger';
import { List } from '../List/List';
import { GoalParentDropdown } from '../GoalParentDropdown/GoalParentDropdown';
import { UserDropdown } from '../UserDropdown/UserDropdown';

import { tr } from './GoalSidebar.i18n';
import s from './GoalSidebar.module.css';

const tagsLimit = 5;

interface GoalSidebarProps {
    goal: NonNullable<GoalByIdReturnType>;
    onGoalTransfer: (goal: NonNullable<GoalChangeProjectReturnType>) => void;
    onGoalClick?: ComponentProps<typeof GoalList>['onClick'];
}

export const GoalSidebar: FC<GoalSidebarProps> = ({ goal, onGoalTransfer, onGoalClick }) => {
    const participantsFilter = useMemo(() => {
        const participantsIds = goal.participants.map(({ id }) => id);
        const { owner, activity: issuer } = goal;

        if (owner && issuer) {
            return participantsIds.concat([owner.id, issuer.id]);
        }
        return participantsIds;
    }, [goal]);

    const relationsGoalsLength = useMemo(() => goal._relations.flatMap((deps) => deps.goals).length, [goal._relations]);

    const {
        goalProjectChange,
        addPartnerProject,
        removePartnerProject,
        onGoalParticipantAdd,
        onGoalParticipantRemove,
        goalOwnerUpdate,
        onGoalDependencyAdd,
        onGoalDependencyRemove,
        validateGoalCriteriaBindings,
        onGoalTagAdd,
        onGoalTagRemove,
        onGoalCriteriaAdd,
        onGoalCriteriaRemove,
    } = useGoalResource(
        {
            id: goal.id,
        },
        {
            invalidate: {
                getById: goal._shortId,
                getGoalActivityFeed: { goalId: goal?.id },
            },
            afterInvalidate: dispatchPreviewUpdateEvent,
        },
    );

    const heading = useMemo(() => {
        return {
            [dependencyKind.blocks]: tr('blocks'),
            [dependencyKind.dependsOn]: tr('dependsOn'),
            [dependencyKind.relatedTo]: tr('relatedTo'),
        };
    }, []);

    const handleConnectGoal = useCallback(
        async (values: { title?: string; selected?: { id: string } | null; weight?: string }) => {
            if (values.title && values.selected) {
                await onGoalCriteriaAdd({
                    title: values.title,
                    goalId: values.selected.id,
                    weight: values.weight,
                    criteriaGoal: {
                        id: goal.id,
                    },
                });
            }
        },
        [goal.id, onGoalCriteriaAdd],
    );

    const onTranfer = useCallback(
        async (project: { id: string }) => {
            const transferedGoal = await goalProjectChange(project.id);

            if (transferedGoal) {
                onGoalTransfer(transferedGoal);
                dispatchPreviewUpdateEvent();
            }
        },
        [goalProjectChange, onGoalTransfer],
    );

    const onOwnerChange = useCallback(
        async (activity: { id: string }) => {
            const updatedGoal = await goalOwnerUpdate(activity.id);

            if (updatedGoal?.project?.personal) {
                onGoalTransfer(updatedGoal);
                dispatchPreviewUpdateEvent();
            }
        },
        [goalOwnerUpdate, onGoalTransfer],
    );

    return (
        <>
            <IssueMeta title={tr('Issuer')}>
                {nullable(safeUserData(goal.activity), (props) => (
                    <UserBadge {...props} />
                ))}
            </IssueMeta>

            <IssueMeta title={tr('Assignee')}>
                {nullable(
                    goal._isEditable,
                    () => (
                        <UserDropdown
                            mode="single"
                            placement="bottom-start"
                            placeholder={tr('Type user name or email')}
                            onChange={onOwnerChange}
                            renderTrigger={({ onClick, ref }) =>
                                nullable(
                                    safeUserData(goal.owner),
                                    (props) => (
                                        <UserBadge ref={ref} {...props}>
                                            <IconXCircleSolid size="xs" onClick={onClick} />
                                        </UserBadge>
                                    ),
                                    <AddInlineTrigger text={tr('Assign')} onClick={onClick} ref={ref} />,
                                )
                            }
                        />
                    ),
                    nullable(safeUserData(goal.owner), (props) => <UserBadge {...props} />, tr('Not assigned yet')),
                )}
            </IssueMeta>

            {nullable(goal._isEditable || goal.participants.length, () => (
                <IssueMeta title={tr('Participants')}>
                    <UserEditableList
                        users={goal.participants}
                        filterIds={participantsFilter}
                        editable={goal._isEditable && !goal.project?.personal}
                        onAdd={onGoalParticipantAdd}
                        onRemove={onGoalParticipantRemove}
                        triggerText={tr('Add participant')}
                    />
                </IssueMeta>
            ))}

            {nullable(goal._isEditable || goal.partnershipProjects.length, () => (
                <IssueMeta title={tr('Partnership projects')}>
                    {nullable(goal.partnershipProjects, (list) => (
                        <List
                            list={list}
                            className={s.PartnershipProjectsList}
                            renderItem={(project) => (
                                <ProjectBadge id={project.id} title={project.title}>
                                    {nullable(goal._isEditable, () => (
                                        <IconXCircleSolid size="xs" onClick={() => removePartnerProject(project.id)} />
                                    ))}
                                </ProjectBadge>
                            )}
                        />
                    ))}

                    {nullable(goal._isEditable, () => (
                        <GoalParentDropdown
                            mode="single"
                            placement="bottom-start"
                            placeholder={tr('Type project title')}
                            onChange={({ id }) => addPartnerProject(id)}
                            renderTrigger={(props) => (
                                <AddInlineTrigger text={tr('Add project')} onClick={props.onClick} ref={props.ref} />
                            )}
                        />
                    ))}
                </IssueMeta>
            ))}

            {nullable(relationsGoalsLength || goal._isEditable, () => (
                <div {...goalDependencies.attr} className={s.GoalRelationKinds}>
                    {goal._relations.map(({ kind, goals }) => {
                        return nullable(goals.length, () => (
                            <IssueMeta
                                title={heading[kind]}
                                key={kind}
                                className={s.GoalRelationsIssueMeta}
                                {...goalDependencyKinds[kind].attr}
                            >
                                <GoalList
                                    canEdit={goal._isEditable}
                                    goals={goals}
                                    onClick={onGoalClick}
                                    onRemove={(removedGoal) =>
                                        onGoalDependencyRemove({
                                            id: goal.id,
                                            kind: removedGoal._kind,
                                            relation: { id: removedGoal.id },
                                        })
                                    }
                                    {...goalDependencyGoalsListItem.attr}
                                />
                            </IssueMeta>
                        ));
                    })}

                    {nullable(goal._isEditable, () => (
                        <GoalFormPopupTrigger
                            renderTrigger={(props) => (
                                <AddInlineTrigger
                                    text={tr('Add dependency')}
                                    ref={props.ref}
                                    onClick={props.onClick}
                                    {...goalDependenciesTrigger.attr}
                                />
                            )}
                        >
                            <GoalDependency id={goal.id} items={goal._relations} onSubmit={onGoalDependencyAdd} />
                        </GoalFormPopupTrigger>
                    ))}
                </div>
            ))}

            {nullable(goal._versaCriteria?.length || goal._isEditable, () => (
                <IssueMeta title={tr('Is the criteria for')}>
                    {nullable(goal._versaCriteria, (list) => (
                        <GoalList
                            canEdit={goal._isEditable}
                            goals={list.map((criteria) => ({
                                ...criteria.goal,
                                criteriaId: criteria.id,
                            }))}
                            onClick={onGoalClick || undefined}
                            onRemove={(goal) => onGoalCriteriaRemove({ id: goal.criteriaId, goalId: goal.id })}
                        />
                    ))}

                    {nullable(goal._isEditable, () => (
                        <GoalFormPopupTrigger
                            renderTrigger={(props) => (
                                <AddInlineTrigger
                                    text={tr('Connect to goal')}
                                    ref={props.ref}
                                    onClick={props.onClick}
                                />
                            )}
                        >
                            <GoalCriteriaSuggest
                                id={goal.id}
                                defaultMode="goal"
                                items={goal._versaCriteria}
                                onSubmit={handleConnectGoal}
                                validateGoalCriteriaBindings={validateGoalCriteriaBindings}
                                versa
                                restrictedSearch
                            />
                        </GoalFormPopupTrigger>
                    ))}
                </IssueMeta>
            ))}

            {nullable(goal._isEditable || goal.tags.length, () => (
                <IssueMeta title={tr('Tags')}>
                    <TagsList className={s.GoalTagList}>
                        {goal.tags.map((tag) => (
                            <Tag
                                key={tag.id}
                                action={nullable(goal._isEditable, () => (
                                    <TagCleanButton onClick={onGoalTagRemove(goal.tags, tag)} />
                                ))}
                            >
                                {tag.title}
                            </Tag>
                        ))}
                    </TagsList>

                    {nullable(goal._isEditable, () => (
                        <TagComboBox
                            disabled={(goal.tags || []).length >= tagsLimit}
                            placeholder={tr('Enter tag title')}
                            value={goal.tags}
                            onChange={onGoalTagAdd}
                            size="s"
                            renderAddTrigger={({ onClick, attrs }) => (
                                <AddInlineTrigger text={tr('Add tag')} onClick={onClick} {...attrs} />
                            )}
                        />
                    ))}
                </IssueMeta>
            ))}

            {nullable(goal._isEditable, () => (
                <IssueMeta>
                    <GoalParentDropdown
                        mode="single"
                        placement="bottom-start"
                        placeholder={tr('Type project title')}
                        onChange={onTranfer}
                        renderTrigger={(props) => (
                            <AddInlineTrigger
                                icon={<IconArrowRightOutline size="xs" />}
                                text={tr('Transfer goal')}
                                onClick={props.onClick}
                                ref={props.ref}
                            />
                        )}
                    />
                    <br />
                    <AddInlineTrigger
                        icon={<IconLayersSubtractOutline size="xs" />}
                        text={tr('Clone goal')}
                        onClick={dispatchModalEvent(ModalEvent.GoalCreateModal, goal)}
                    />
                    <br />
                    <AddInlineTrigger
                        icon={<IconBinOutline size="xs" {...goalPageDeleteButton.attr} />}
                        text={tr('Archive goal')}
                        onClick={dispatchModalEvent(ModalEvent.GoalDeleteModal)}
                    />
                </IssueMeta>
            ))}
        </>
    );
};
