import { ComponentProps, FC, MouseEvent, forwardRef, useMemo } from 'react';
import styled from 'styled-components';
import { Tag, TagCleanButton, nullable } from '@taskany/bricks';
import { IconArrowRightOutline, IconBinOutline, IconPlusCircleOutline, IconXCircleSolid } from '@taskany/icons';
import { gapXs } from '@taskany/colors';

import { IssueMeta } from '../IssueMeta';
import { UserBadge } from '../UserBadge';
import { UserComboBox } from '../UserComboBox';
import { TagComboBox } from '../TagComboBox';
import { GoalParentComboBox } from '../GoalParentComboBox';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { InlineTrigger } from '../InlineTrigger';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { useGoalResource } from '../../hooks/useGoalResource';
import { ProjectBadge } from '../ProjectBadge';
import { TextList, TextListItem } from '../TextList';
import { safeUserData } from '../../utils/getUserName';
import { goalPageDeleteButton } from '../../utils/domObjects';
import { dispatchPreviewUpdateEvent } from '../GoalPreview/GoalPreviewProvider';
import { GoalDependencyListByKind } from '../GoalDependencyList';
import { GoalFormPopupTrigger } from '../GoalFormPopupTrigger';
import { GoalDependency } from '../GoalDependency/GoalDependency';
import { TagsList } from '../TagsList';
import { dependencyKind } from '../../schema/goal';

import { tr } from './GoalSidebar.i18n';

const tagsLimit = 5;

const StyledInlineTrigger = styled(InlineTrigger)`
    margin-left: 5px; // 24 / 2 - 7 center of UserPic and center of PlusIcon
    height: 28px; // Input height
`;

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
    onGoalTagRemove: (tag: NonNullable<GoalByIdReturnType>['tags'][number]) => (e: MouseEvent<Element>) => void;
    onGoalTagAdd: ComponentProps<typeof TagComboBox>['onChange'];
    onGoalTransfer: ComponentProps<typeof GoalParentComboBox>['onChange'];
    onGoalDependencyClick?: ComponentProps<typeof GoalDependencyListByKind>['onClick'];
}

interface AddInlineTriggerProps {
    text: string;
    onClick: ComponentProps<typeof InlineTrigger>['onClick'];
    icon?: React.ReactNode;
}

const AddInlineTrigger = forwardRef<HTMLDivElement, AddInlineTriggerProps>(
    ({ icon = <IconPlusCircleOutline size="xs" />, text, onClick }, ref) => (
        <StyledInlineTrigger ref={ref} icon={icon} text={text} onClick={onClick} />
    ),
);

export const GoalSidebar: FC<GoalSidebarProps> = ({
    goal,
    onGoalTagRemove,
    onGoalTagAdd,
    onGoalTransfer,
    onGoalDependencyClick,
}) => {
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
                    <TextList listStyle="none">
                        {goal.participants?.map((activity) =>
                            nullable(safeUserData(activity), (props) => (
                                <TextListItem key={activity.id}>
                                    <UserBadge {...props}>
                                        {nullable(goal._isEditable, () => (
                                            <IconXCircleSolid
                                                size="xs"
                                                onClick={onGoalParticipantRemove(activity.id)}
                                            />
                                        ))}
                                    </UserBadge>
                                </TextListItem>
                            )),
                        )}
                    </TextList>

                    {nullable(goal._isEditable, () => (
                        <StyledInlineInput>
                            <UserComboBox
                                placement="bottom-start"
                                placeholder={tr('Type user name or email')}
                                filter={participantsFilter}
                                onChange={onGoalParticipantAdd}
                                renderTrigger={(props) => (
                                    <AddInlineTrigger text={tr('Add participant')} onClick={props.onClick} />
                                )}
                            />
                        </StyledInlineInput>
                    ))}
                </IssueMeta>
            ))}

            {nullable(goal._isEditable || goal.partnershipProjects.length, () => (
                <IssueMeta title={tr('Partnership projects')}>
                    <StyledTextList>
                        {goal.partnershipProjects?.map((project) => (
                            <TextListItem key={project.id}>
                                <ProjectBadge id={project.id} title={project.title}>
                                    {nullable(goal._isEditable, () => (
                                        <IconXCircleSolid size="xs" onClick={() => removePartnerProject(project.id)} />
                                    ))}
                                </ProjectBadge>
                            </TextListItem>
                        ))}
                    </StyledTextList>

                    {nullable(goal._isEditable, () => (
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

            {nullable(relationsGoalsLength || goal._isEditable, () => (
                <>
                    {goal._relations.map(({ kind, goals }) => {
                        return nullable(goals.length, () => (
                            <IssueMeta title={heading[kind]} key={kind}>
                                <GoalDependencyListByKind
                                    id={goal.id}
                                    kind={kind}
                                    goals={goals}
                                    onClick={onGoalDependencyClick}
                                    onRemove={onGoalDependencyRemove}
                                />
                            </IssueMeta>
                        ));
                    })}

                    {nullable(goal._isEditable, () => (
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

            {nullable(goal._isEditable || goal.tags.length, () => (
                <IssueMeta title={tr('Tags')}>
                    <TagsList>
                        {goal.tags.map((tag) => (
                            <Tag key={tag.id}>
                                {nullable(goal._isEditable, () => (
                                    <TagCleanButton onClick={onGoalTagRemove(tag)} />
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
