import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { usePageContext } from '../hooks/usePageContext';
import { CreateFormType, useCommentResource } from '../hooks/useCommentResource';

import { UserPic } from './UserPic';
import { CommentForm } from './CommentForm';
import { ActivityFeedItem } from './ActivityFeed';

interface CommentCreateFormProps {
    goalId: string;

    onSubmit?: (id?: string) => void;
    onFocus?: () => void;
    onCancel?: () => void;
}

const CommentCreateForm: React.FC<CommentCreateFormProps> = ({ onSubmit, onFocus, onCancel, goalId }) => {
    const t = useTranslations('Comment.new');
    const { user } = usePageContext();
    const { createSchema, create } = useCommentResource({ t });
    const [focus, setFocus] = useState<boolean | undefined>();
    const [busy, setBusy] = useState(false);

    type CommentFormType = z.infer<typeof createSchema>;

    const {
        control,
        handleSubmit,
        reset,
        formState: { isValid },
    } = useForm<CreateFormType>({
        resolver: zodResolver(createSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: {
            goalId,
        },
    });

    const createComment = useCallback(
        (form: CommentFormType) => {
            setBusy(true);

            // FIXME: maybe async/await would be better API
            create(({ id }) => {
                onSubmit?.(id);
                reset();
                setFocus(false);
                setBusy(false);
            })(form);
        },
        [create, onSubmit, reset],
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
                i18nKeyset="Comment.new"
                control={control}
                isValid={isValid}
                height={focus ? 120 : 60}
                onSubmit={handleSubmit(createComment)}
                onCancel={onCancelCreate}
                onFocus={onCommentFocus}
            />
        </ActivityFeedItem>
    );
};

export default CommentCreateForm;
