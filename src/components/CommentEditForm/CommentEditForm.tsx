import React, { useCallback } from 'react';
import { Button } from '@taskany/bricks';

import { useCommentResource } from '../../hooks/useCommentResource';
import { CommentForm } from '../CommentForm/CommentForm';
import { GoalCommentSchema } from '../../schema/goal';

import { tr } from './CommentEditForm.i18n';

interface CommentEditFormProps {
    id: string;
    description: string;
    setFocus?: boolean;

    onUpdate: (comment?: { id: string; description: string }) => void;
    onChange: (comment: { description: string }) => void;
    onCancel: () => void;
}

const CommentEditForm: React.FC<CommentEditFormProps> = ({ id, description, onUpdate, onChange, onCancel }) => {
    const { update } = useCommentResource();

    const onCommentUpdate = useCallback(
        (form: GoalCommentSchema) => {
            // optimistic update
            onChange?.({ description: form.description });
            update((comment) => {
                onUpdate?.(comment);
            })(form);
        },
        [update, onUpdate, onChange],
    );

    return (
        <CommentForm
            id={id}
            description={description}
            autoFocus
            height={120}
            onSubmit={onCommentUpdate}
            onCancel={onCancel}
            renderActionButton={({ busy }) => (
                <Button size="m" view="primary" disabled={busy} outline type="submit" text={tr('Save')} />
            )}
        />
    );
};

export default CommentEditForm;
