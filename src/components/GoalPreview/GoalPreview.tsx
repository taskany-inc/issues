import React, { FC, useCallback, useRef } from 'react';
import { nullable } from '@taskany/bricks';
import { IconEdit1Outline } from '@taskany/icons';
import { Button, ModalContent, ModalHeader, ModalPreview } from '@taskany/bricks/harmony';

import { routes } from '../../hooks/router';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { useGoalResource } from '../../hooks/useGoalResource';
import { GoalHeader } from '../GoalHeader/GoalHeader';
import { GoalContentHeader } from '../GoalContentHeader/GoalContentHeader';
import { GoalActivityFeed } from '../GoalActivityFeed/GoalActivityFeed';
import { GoalSidebar } from '../GoalSidebar/GoalSidebar';
import { RelativeTime } from '../RelativeTime/RelativeTime';

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

    const handleOpenPreview = useCallback(
        <T extends { _shortId: string; [key: string]: unknown }>(goal: T | null) => {
            if (goal != null) {
                setPreview(goal._shortId, goal);
            }
        },
        [setPreview],
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
                    actions={
                        <>
                            <div />
                            <div className={s.GoalPreviewActionsWrapper}>
                                {nullable(goal?._isEditable, () => (
                                    <Button
                                        text={tr('Edit')}
                                        iconLeft={<IconEdit1Outline size="xs" />}
                                        onClick={dispatchModalEvent(ModalEvent.GoalEditModal)}
                                    />
                                ))}
                                {nullable(goal?.updatedAt, (date) => (
                                    <RelativeTime className={s.UpdatedTime} kind="updated" date={date} />
                                ))}
                            </div>
                        </>
                    }
                />
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
                        <GoalSidebar goal={g} onGoalTransfer={handleOpenPreview} onGoalClick={handleOpenPreview} />
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
