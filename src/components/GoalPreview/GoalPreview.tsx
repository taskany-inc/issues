import React, { FC, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { Button, Dot, ModalContent, ModalHeader, ModalPreview, nullable } from '@taskany/bricks';
import { IconEditOutline } from '@taskany/icons';

import { routes } from '../../hooks/router';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { useGoalResource } from '../../hooks/useGoalResource';
import { GoalHeader } from '../GoalHeader';
import { GoalContentHeader } from '../GoalContentHeader/GoalContentHeader';
import { GoalActivityFeed } from '../GoalActivityFeed';
import { IssueParent } from '../IssueParent';
import { GoalSidebar } from '../GoalSidebar/GoalSidebar';
import { TagObject } from '../../types/tag';

import { useGoalPreview } from './GoalPreviewProvider';
import { tr } from './GoalPreview.i18n';

interface GoalPreviewProps {
    shortId: string;
    goal: GoalByIdReturnType;
    defaults: Partial<GoalByIdReturnType>;
    onClose?: () => void;
    onDelete?: () => void;
}

const StyledModalWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 250px;
    overflow: auto;
`;

const StyledModalHeader = styled(ModalHeader)`
    top: 0;
    position: sticky;

    box-shadow: 0 2px 5px 2px rgb(0 0 0 / 10%);
    z-index: 3; // modal header must be upper than content
`;

const StyledModalContent = styled(ModalContent)`
    z-index: 2; // needed that dropdowns will be upper than sidebar
`;

const StyledStickyModalContent = styled(ModalContent)`
    position: sticky;
    top: 0;
    height: fit-content;
`;

const StyledModalPreview = styled(ModalPreview)`
    width: 850px;
    display: flex;
    flex-direction: column;
`;

const GoalPreviewModal: React.FC<GoalPreviewProps> = ({ shortId, goal, defaults, onClose, onDelete }) => {
    const { setPreview } = useGoalPreview();
    const onPreviewClose = useCallback(() => {
        onClose?.();
    }, [onClose]);

    const { goalProjectChange, onGoalStateChange, goalTagsUpdate, invalidate } = useGoalResource(
        { id: goal?.id },
        { invalidate: { getById: shortId } },
    );

    // FIXME https://github.com/taskany-inc/issues/issues/1853
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

    const onGoalTransfer = useCallback(
        async (project?: { id: string }) => {
            if (!project) return;

            const transferedGoal = await goalProjectChange(project.id);

            if (transferedGoal) {
                setPreview(transferedGoal._shortId, transferedGoal);
            }
        },
        [goalProjectChange, setPreview],
    );

    const commentsRef = useRef<HTMLDivElement>(null);

    const onCommentsClick = useCallback(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    return (
        <StyledModalPreview visible onClose={onPreviewClose}>
            <StyledModalHeader>
                <GoalHeader
                    goal={goal || defaults}
                    size="xl"
                    href={routes.goal(shortId)}
                    onCommentsClick={onCommentsClick}
                    onGoalStateChange={onGoalStateChange}
                    actions={nullable(goal?._isEditable, () => (
                        <>
                            <div />
                            <Button
                                text={tr('Edit')}
                                iconLeft={<IconEditOutline size="xs" />}
                                onClick={dispatchModalEvent(ModalEvent.GoalEditModal)}
                            />
                        </>
                    ))}
                >
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
                </GoalHeader>
            </StyledModalHeader>
            <StyledModalWrapper>
                <StyledModalContent>
                    {nullable(goal, (g) => (
                        <GoalContentHeader date={g.createdAt} description={g.description} />
                    ))}

                    {nullable(goal, (g) => (
                        <GoalActivityFeed ref={commentsRef} goal={g} shortId={shortId} onGoalDeleteConfirm={onDelete} />
                    ))}
                </StyledModalContent>
                <StyledStickyModalContent>
                    {nullable(goal, (g) => (
                        <GoalSidebar
                            goal={g}
                            onGoalTagRemove={onGoalTagRemove}
                            onGoalTagAdd={onGoalTagAdd}
                            onGoalTransfer={onGoalTransfer}
                        />
                    ))}
                </StyledStickyModalContent>
            </StyledModalWrapper>
        </StyledModalPreview>
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
