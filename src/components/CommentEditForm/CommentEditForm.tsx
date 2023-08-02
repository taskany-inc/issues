import React, { useCallback, useState } from 'react';
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
    onFocus?: () => void;
}

const CommentEditForm: React.FC<CommentEditFormProps> = ({
    id,
    description: currentDescription,
    onUpdate,
    onChange,
    onCancel,
    onFocus,
}) => {
    const { update } = useCommentResource();
    const [description, setDescription] = useState(currentDescription);
    const [focused, setFocused] = useState(false);
    const [busy, setBusy] = useState(false);

    const onCommentFocus = useCallback(() => {
        setFocused(true);
        onFocus?.();
    }, [onFocus]);

    const onCommentUpdate = useCallback(
        (form: GoalCommentSchema) => {
            setBusy(true);
            setFocused(false);

            // optimistic update
            onChange?.({ description: form.description });

            update((comment) => {
                setBusy(false);
                setDescription(comment.description);
                onUpdate?.(comment);
            })(form);
        },
        [update, onUpdate, onChange],
    );

    return (
        <CommentForm
            id={id}
            description={description}
            focused={focused}
            busy={busy}
            autoFocus
            height={120}
            onDescriptionChange={setDescription}
            onFocus={onCommentFocus}
            onSubmit={onCommentUpdate}
            onCancel={onCancel}
            actionButton={
                <Button
                    size="m"
                    view="primary"
                    disabled={currentDescription === description || busy}
                    outline
                    type="submit"
                    text={tr('Save')}
                />
            }
        />
    );
};

export default CommentEditForm;
