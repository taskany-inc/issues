import React, { FC, useCallback, useRef } from 'react';
import { Dot, ModalContent, ModalHeader, ModalPreview, nullable } from '@taskany/bricks';
import { IconEditOutline } from '@taskany/icons';
import { Button } from '@taskany/bricks/harmony';

import { routes } from '../../hooks/router';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { useGoalResource } from '../../hooks/useGoalResource';
import { GoalHeader } from '../GoalHeader';
import { GoalContentHeader } from '../GoalContentHeader/GoalContentHeader';
import { GoalActivityFeed } from '../GoalActivityFeed';
import { IssueParent } from '../IssueParent';
import { GoalSidebar } from '../GoalSidebar/GoalSidebar';

import { dispatchPreviewDeleteEvent, dispatchPreviewUpdateEvent, useGoalPreview } from './GoalPreviewProvider';
import { tr } from './GoalPreview.i18n';
import s from './GoalPreview.module.css';

interface GoalPreviewProps {
    shortId: string;
    goal: GoalByIdReturnType;
    defaults: Partial<GoalByIdReturnType>;
    onClose?: () => void;
    onDelete?: () => void;
}

const GoalPreviewModal: React.FC<GoalPreviewProps> = ({ shortId, goal, defaults, onClose, onDelete }) => {
    const { setPreview } = useGoalPreview();
    const onPreviewClose = useCallback(() => {
        onClose?.();
    }, [onClose]);

    const { onGoalStateChange } = useGoalResource(
        { id: goal?.id },
        { invalidate: { getById: goal?._shortId }, afterInvalidate: dispatchPreviewUpdateEvent },
    );

    const commentsRef = useRef<HTMLDivElement>(null);

    const onCommentsClick = useCallback(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const handleGoalDelete = useCallback<NonNullable<typeof onDelete>>(
        (...args) => {
            if (onDelete) {
                onDelete(...args);
            }
            dispatchPreviewDeleteEvent();
        },
        [onDelete],
    );

    return (
        <ModalPreview visible onClose={onPreviewClose} className={s.ModalPreview}>
            <ModalHeader className={s.ModalHeader}>
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
            </ModalHeader>
            <div className={s.ModalWrapper}>
                <ModalContent className={s.ModalContent}>
                    {nullable(goal, (g) => (
                        <GoalContentHeader date={g.createdAt} description={g.description} />
                    ))}

                    {nullable(goal, (g) => (
                        <GoalActivityFeed
                            ref={commentsRef}
                            goal={g}
                            shortId={shortId}
                            onGoalDeleteConfirm={handleGoalDelete}
                            onInvalidate={dispatchPreviewUpdateEvent}
                        />
                    ))}
                </ModalContent>
                <ModalContent className={s.ModalContent}>
                    {nullable(goal, (g) => (
                        <GoalSidebar goal={g} onGoalTransfer={(goal) => setPreview(goal._shortId, goal)} />
                    ))}
                </ModalContent>
            </div>
        </ModalPreview>
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
