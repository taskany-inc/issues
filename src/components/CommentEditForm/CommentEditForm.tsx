import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { UpdateFormType, useCommentResource } from '../../hooks/useCommentResource/useCommentResource';
import { Comment } from '../../../graphql/@generated/genql';
import { CommentForm } from '../CommentForm/CommentForm';

import { tr } from './CommentEditForm.i18n';

interface CommentEditFormProps {
    id: string;
    description: string;
    setFocus?: boolean;

    onChanged: (comment: { id: string; description: string }) => void;
    onUpdate: (comment?: Partial<Comment>) => void;
    onCancel: () => void;
}

const CommentEditForm: React.FC<CommentEditFormProps> = ({ id, description, onChanged, onUpdate, onCancel }) => {
    const { updateSchema, update } = useCommentResource();
    const [busy, setBusy] = useState(false);

    type CommentFormType = z.infer<typeof updateSchema>;

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors, isValid },
    } = useForm<UpdateFormType>({
        resolver: zodResolver(updateSchema),
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
        (form: CommentFormType) => {
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
