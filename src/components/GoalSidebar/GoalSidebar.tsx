import { Tag, TagCleanButton, nullable } from '@taskany/bricks';
import { IconArrowRightOutline, IconBinOutline, IconEditOutline, IconPlusCircleOutline } from '@taskany/icons';
import styled from 'styled-components';
import { ComponentProps, FC, MouseEvent, useMemo } from 'react';

import { IssueMeta } from '../IssueMeta';
import { UserBadge } from '../UserBadge';
import { UserComboBox } from '../UserComboBox';
import { TagComboBox } from '../TagComboBox';
import { GoalParentComboBox } from '../GoalParentComboBox';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { InlineTrigger } from '../InlineTrigger';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';

import { tr } from './GoalSidebar.i18n';

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

const tagsLimit = 5;

interface GoalSidebarProps {
    goal: NonNullable<GoalByIdReturnType>;
    onGoalParticipantRemove: (id?: string | null) => ComponentProps<typeof UserBadge>['onCleanButtonClick'];
    onGoalParticipantAdd: ComponentProps<typeof UserComboBox>['onChange'];
    onGoalAssigneeChange: ComponentProps<typeof UserComboBox>['onChange'];
    onGoalTagRemove: (tag: NonNullable<GoalByIdReturnType>['tags'][number]) => (e: MouseEvent<Element>) => void;
    onGoalTagAdd: ComponentProps<typeof TagComboBox>['onChange'];
    onGoalTransfer: ComponentProps<typeof GoalParentComboBox>['onChange'];
}

export const GoalSidebar: FC<GoalSidebarProps> = ({
    goal,
    onGoalAssigneeChange,
    onGoalParticipantRemove,
    onGoalParticipantAdd,
    onGoalTagRemove,
    onGoalTagAdd,
    onGoalTransfer,
}) => {
    const participantsFilter = useMemo(() => {
        const participantsIds = goal.participants.map(({ id }) => id);
        const { owner, activity: issuer } = goal;

        if (owner && issuer) {
            return participantsIds.concat([owner.id, issuer.id]);
        }
        return participantsIds;
    }, [goal]);

    return (
        <>
            <IssueMeta title={tr('Issuer')}>
                <UserBadge user={goal.activity?.user} />
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
                                <UserBadge user={goal.owner?.user} />
                                <StyledIconEditOutline size="xxs" onClick={props.onClick} />
                            </StyledInlineUserInput>
                        )}
                    />
                ) : (
                    <UserBadge user={goal.owner?.user} />
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

            {nullable(goal._isEditable || goal.tags.length, () => (
                <>
                    <IssueMeta title={tr('Tags')}>
                        {goal.tags?.map((tag) => (
                            <Tag key={tag.id}>
                                <TagCleanButton onClick={onGoalTagRemove(tag)} />
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
        </>
    );
};
