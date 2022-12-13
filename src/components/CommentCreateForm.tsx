import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';

import { usePageContext } from '../hooks/usePageContext';
import { CreateFormType, useCommentResource } from '../hooks/useCommentResource';

import { UserPic } from './UserPic';
import { CommentForm } from './CommentForm';
import { ActivityFeedItem } from './ActivityFeed';

interface CommentCreateFormProps {
    goalId: string;
    autoFocus?: boolean;

    onSubmit?: (id?: string) => void;
    onFocus?: () => void;
    onCancel?: () => void;
}

const CommentCreateForm: React.FC<CommentCreateFormProps> = ({ onSubmit, onFocus, onCancel, goalId, autoFocus }) => {
    const t = useTranslations('Comment.new');
    const { user } = usePageContext();
    const { createSchema, create } = useCommentResource({ t });
    const [focus, setFocus] = useState<boolean | undefined>();

    const {
        control,
        handleSubmit,
        reset,
        clearErrors,
        formState: { isValid, errors },
    } = useForm<CreateFormType>({
        resolver: zodResolver(createSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: {
            goalId,
        },
    });

    useEffect(() => {
        setFocus(autoFocus);
    }, [autoFocus]);

    const createComment = create(({ id }) => {
        onSubmit?.(id);
        reset();
    });

    const onCommentFocus = useCallback(() => {
        onFocus?.();
        clearErrors();
        setFocus(true);
    }, [onFocus, clearErrors]);

    const onCancelCreate = useCallback(() => {
        onCancel?.();
        reset();
        setFocus(false);
    }, [onCancel, reset]);

    return (
        <ActivityFeedItem>
            <UserPic size={32} src={user?.image} email={user?.email} />

            <CommentForm
                i18nKeyset="Comment.new"
                control={control}
                isValid={isValid}
                error={errors.description}
                autoFocus={focus}
                height={focus ? '120px' : '60px'}
                onSubmit={handleSubmit(createComment)}
                onCancel={onCancelCreate}
                onFocus={onCommentFocus}
            />
        </ActivityFeedItem>
    );
};

export default CommentCreateForm;
