import { ComponentProps, FC, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Tag, TagCleanButton, nullable } from '@taskany/bricks';
import { IconArrowRightOutline, IconBinOutline, IconXCircleSolid } from '@taskany/icons';
import { gapXs } from '@taskany/colors';

import { IssueMeta } from '../IssueMeta';
import { UserBadge } from '../UserBadge';
import { UserComboBox } from '../UserComboBox';
import { TagComboBox } from '../TagComboBox';
import { GoalParentComboBox } from '../GoalParentComboBox';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { useGoalResource } from '../../hooks/useGoalResource';
import { ProjectBadge } from '../ProjectBadge';
import { TextList, TextListItem } from '../TextList';
import { safeUserData } from '../../utils/getUserName';
import { goalPageDeleteButton } from '../../utils/domObjects';
import { dispatchPreviewUpdateEvent } from '../GoalPreview/GoalPreviewProvider';
import { GoalList } from '../GoalList';
import { GoalFormPopupTrigger } from '../GoalFormPopupTrigger';
import { GoalDependency } from '../GoalDependency/GoalDependency';
import { TagsList } from '../TagsList';
import { dependencyKind } from '../../schema/goal';
import { UserEditableList } from '../UserEditableList/UserEditableList';
import { GoalCriteriaSuggest } from '../GoalCriteriaSuggest';
import { AddInlineTrigger } from '../AddInlineTrigger';

import { tr } from './GoalSidebar.i18n';

const tagsLimit = 5;

const StyledInlineInput = styled.div`
    margin-top: ${gapXs};
    height: 28px; // Input height
`;

const StyledTextList = styled(TextList).attrs({
    listStyle: 'none',
})`
    padding-left: ${gapXs};
`;

interface GoalSidebarProps {
    goal: NonNullable<GoalByIdReturnType>;
    onGoalTransfer: ComponentProps<typeof GoalParentComboBox>['onChange'];
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

    const isPublicProject = !goal.project?.accessUsers.length;

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
                        <StyledInlineInput>
                            <UserComboBox
                                placement="bottom-start"
                                placeholder={tr('Type user name or email')}
                                filter={participantsFilter}
                                onChange={goalOwnerUpdate}
                                renderTrigger={({ onClick }) =>
                                    nullable(
                                        safeUserData(goal.owner),
                                        (props) => (
                                            <UserBadge {...props}>
                                                <IconXCircleSolid size="xs" onClick={onClick} />
                                            </UserBadge>
                                        ),
                                        <AddInlineTrigger text={tr('Assign')} onClick={onClick} />,
                                    )
                                }
                            />
                        </StyledInlineInput>
                    ),
                    nullable(safeUserData(goal.owner), (props) => <UserBadge {...props} />, tr('Not assigned yet')),
                )}
            </IssueMeta>

            {nullable(goal._isEditable || goal.participants.length, () => (
                <IssueMeta title={tr('Participants')}>
                    <UserEditableList
                        users={goal.participants}
                        filterIds={participantsFilter}
                        editable={goal._isEditable}
                        onAdd={onGoalParticipantAdd}
                        onRemove={onGoalParticipantRemove}
                        triggerText={tr('Add participant')}
                    />
                </IssueMeta>
            ))}

            {nullable((goal._isEditable && isPublicProject) || goal.partnershipProjects.length, () => (
                <IssueMeta title={tr('Partnership projects')}>
                    <StyledTextList>
                        {goal.partnershipProjects?.map((project) => (
                            <TextListItem key={project.id}>
                                <ProjectBadge id={project.id} title={project.title}>
                                    {nullable(goal._isEditable && isPublicProject, () => (
                                        <IconXCircleSolid size="xs" onClick={() => removePartnerProject(project.id)} />
                                    ))}
                                </ProjectBadge>
                            </TextListItem>
                        ))}
                    </StyledTextList>

                    {nullable(goal._isEditable && isPublicProject, () => (
                        <StyledInlineInput>
                            <GoalParentComboBox
                                placement="bottom-start"
                                placeholder={tr('Type project title')}
                                onChange={({ id }) => addPartnerProject(id)}
                                renderTrigger={(props) => (
                                    <AddInlineTrigger text={tr('Add project')} onClick={props.onClick} />
                                )}
                            />
                        </StyledInlineInput>
                    ))}
                </IssueMeta>
            ))}

            {nullable(relationsGoalsLength || (goal._isEditable && isPublicProject), () => (
                <>
                    {goal._relations.map(({ kind, goals }) => {
                        return nullable(goals.length, () => (
                            <IssueMeta title={heading[kind]} key={kind}>
                                <GoalList
                                    canEdit={goal._isEditable && isPublicProject}
                                    goals={goals}
                                    onClick={onGoalClick}
                                    onRemove={(removedGoal) =>
                                        onGoalDependencyRemove({
                                            id: goal.id,
                                            kind: removedGoal._kind,
                                            relation: { id: removedGoal.id },
                                        })
                                    }
                                />
                            </IssueMeta>
                        ));
                    })}

                    {nullable(goal._isEditable && isPublicProject, () => (
                        <GoalFormPopupTrigger
                            renderTrigger={(props) => (
                                <AddInlineTrigger text={tr('Add dependency')} ref={props.ref} onClick={props.onClick} />
                            )}
                        >
                            <GoalDependency id={goal.id} items={goal._relations} onSubmit={onGoalDependencyAdd} />
                        </GoalFormPopupTrigger>
                    ))}
                </>
            ))}

            {nullable(goal._versaCriteria?.length || (goal._isEditable && isPublicProject), () => (
                <IssueMeta title={tr('Is the criteria for')}>
                    <GoalList
                        canEdit={goal._isEditable && isPublicProject}
                        goals={goal._versaCriteria.map((criteria) => ({
                            ...criteria.goal,
                            criteriaId: criteria.id,
                        }))}
                        onClick={onGoalClick ? (goal) => onGoalClick(goal) : undefined}
                        onRemove={(goal) => onGoalCriteriaRemove({ id: goal.criteriaId, goalId: goal.id })}
                    />

                    {nullable(goal._isEditable && isPublicProject, () => (
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
                            />
                        </GoalFormPopupTrigger>
                    ))}
                </IssueMeta>
            ))}

            {nullable(goal._isEditable || goal.tags.length, () => (
                <IssueMeta title={tr('Tags')}>
                    <TagsList>
                        {goal.tags.map((tag) => (
                            <Tag key={tag.id}>
                                {nullable(goal._isEditable, () => (
                                    <TagCleanButton onClick={onGoalTagRemove(goal.tags, tag)} />
                                ))}
                                {tag.title}
                            </Tag>
                        ))}
                    </TagsList>

                    {nullable(goal._isEditable, () => (
                        <StyledInlineInput>
                            <TagComboBox
                                disabled={(goal.tags || []).length >= tagsLimit}
                                placeholder={tr('Enter tag title')}
                                value={goal.tags}
                                onChange={onGoalTagAdd}
                                renderTrigger={(props) => (
                                    <AddInlineTrigger text={tr('Add tag')} onClick={props.onClick} />
                                )}
                            />
                        </StyledInlineInput>
                    ))}
                </IssueMeta>
            ))}

            {nullable(goal._isEditable, () => (
                <IssueMeta>
                    <StyledInlineInput>
                        <GoalParentComboBox
                            placement="bottom-start"
                            placeholder={tr('Type project title')}
                            onChange={onGoalTransfer}
                            renderTrigger={(props) => (
                                <AddInlineTrigger
                                    icon={<IconArrowRightOutline size="xs" />}
                                    text={tr('Transfer goal')}
                                    onClick={props.onClick}
                                />
                            )}
                        />
                    </StyledInlineInput>

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
