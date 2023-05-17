import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCommentResource } from '../../hooks/useCommentResource';
import { CommentForm } from '../CommentForm/CommentForm';
import { CommentUpdate, commentUpdateSchema } from '../../schema/comment';

import { tr } from './CommentEditForm.i18n';

interface CommentEditFormProps {
    id: string;
    description: string;
    setFocus?: boolean;

    onChanged: (comment: { id: string; description: string }) => void;
    onUpdate: (comment?: { id: string; description: string }) => void;
    onCancel: () => void;
}

const CommentEditForm: React.FC<CommentEditFormProps> = ({ id, description, onChanged, onUpdate, onCancel }) => {
    const { update } = useCommentResource();
    const [busy, setBusy] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors, isValid },
    } = useForm<CommentUpdate>({
        resolver: zodResolver(commentUpdateSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: {
            id,
            description,
        },
    });

    const newDescription = watch('description');
    const isUpdateAllowed = isValid && newDescription !== description;
    useEffect(() => {
        isUpdateAllowed && onChanged?.({ id, description });
    }, [id, description, isUpdateAllowed, onChanged]);

    const onCommentUpdate = useCallback(
        (form: CommentUpdate) => {
            setBusy(true);

            update((comment) => {
                onUpdate?.(comment);
                setBusy(false);
            })(form);
        },
        [update, onUpdate],
    );

    return (
        <CommentForm
            busy={busy}
            control={control}
            autoFocus
            height={120}
            isValid={isUpdateAllowed && isValid}
            error={errors.description}
            onSubmit={handleSubmit(onCommentUpdate)}
            onCancel={onCancel}
            actionButtonText={tr('Save')}
        />
    );
};

export default CommentEditForm;
