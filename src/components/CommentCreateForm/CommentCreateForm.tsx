import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPic } from '@taskany/bricks';

import { usePageContext } from '../../hooks/usePageContext';
import { useCommentResource } from '../../hooks/useCommentResource';
import { CommentForm } from '../CommentForm/CommentForm';
import { ActivityFeedItem } from '../ActivityFeed';
import { CommentCreate, commentCreateSchema } from '../../schema/comment';

import { tr } from './CommentCreateForm.i18n';

interface CommentCreateFormProps {
    goalId: string;

    onSubmit?: (id?: string) => void;
    onFocus?: () => void;
    onCancel?: () => void;
}

const CommentCreateForm: React.FC<CommentCreateFormProps> = ({ onSubmit, onFocus, onCancel, goalId }) => {
    const { user } = usePageContext();
    const { create } = useCommentResource();
    const [focus, setFocus] = useState<boolean | undefined>();
    const [busy, setBusy] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        formState: { isValid },
    } = useForm<CommentCreate>({
        resolver: zodResolver(commentCreateSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: {
            goalId,
            description: '',
        },
    });

    const createComment = useCallback(
        (form: CommentCreate) => {
            setBusy(true);

            // FIXME: maybe async/await would be better API
            create(({ id }) => {
                onSubmit?.(id);
                reset();
                setFocus(false);
                setBusy(false);
            })({
                ...form,
                goalId,
            });
        },
        [create, goalId, onSubmit, reset],
    );

    const onCommentFocus = useCallback(() => {
        onFocus?.();
        setFocus(true);
    }, [onFocus]);

    const onCancelCreate = useCallback(() => {
        onCancel?.();
        reset();
        setFocus(false);
    }, [onCancel, reset]);

    return (
        <ActivityFeedItem>
            <UserPic size={32} src={user?.image} email={user?.email} />

            <CommentForm
                busy={busy}
                control={control}
                isValid={isValid}
                height={focus ? 120 : 60}
                onSubmit={handleSubmit(createComment)}
                onCancel={onCancelCreate}
                onFocus={onCommentFocus}
                actionButtonText={tr('Comment')}
            />
        </ActivityFeedItem>
    );
};

export default CommentCreateForm;
