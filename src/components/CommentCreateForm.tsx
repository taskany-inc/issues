import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import styled from 'styled-components';

import { gql } from '../utils/gql';
import { backgroundColor, gapS, gray4, gray6 } from '../design/@generated/themes';
import { submitKeys } from '../utils/hotkeys';
import { routes } from '../hooks/router';
import { nullable } from '../utils/nullable';
import { usePageContext } from '../hooks/usePageContext';

import { Form } from './Form';
import { FormCard } from './FormCard';
import { UserPic } from './UserPic';
import { Icon } from './Icon';
import { FormAction, FormActions } from './FormActions';
import { Button } from './Button';
import { Tip } from './Tip';
import { Link } from './Link';
import { FormEditor } from './FormEditor';

interface CommentCreateFormProps {
    goalId: string;
    setFocus?: boolean;

    onCreate?: (id?: string) => void;
    onBlur?: () => void;
}

const StyledComment = styled.div`
    display: grid;
    grid-template-columns: 35px 1fr;
    column-gap: 15px;
`;

const StyledFormBottom = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: ${gapS} ${gapS} 0 ${gapS};
`;

const StyledCommentForm = styled(FormCard)`
    &::before {
        position: absolute;
        z-index: 0;

        content: '';

        width: 14px;
        height: 14px;

        background-color: ${backgroundColor};

        border-left: 1px solid ${gray4};
        border-top: 1px solid ${gray4};
        border-radius: 2px;

        transform: rotate(-45deg);
        top: 10px;
        left: -8px;
    }
`;

const StyledTip = styled(Tip)`
    padding: 0;
`;

const commentHeightMap: Record<string, string> = {
    true: '120px',
    false: '60px',
};

const schemaProvider = (t: (key: string) => string) =>
    z.object({
        comment: z
            .string({
                required_error: t("Comments's description is required"),
                invalid_type_error: t("Comments's description must be a string"),
            })
            .min(1, {
                message: t("Comments's description must be longer than 1 symbol"),
            }),
    });

type FormType = z.infer<ReturnType<typeof schemaProvider>>;

const CommentCreateForm: React.FC<CommentCreateFormProps> = ({ onCreate, onBlur, goalId, setFocus }) => {
    const t = useTranslations('Comments.new');
    const schema = schemaProvider(t);
    const { user, locale } = usePageContext();
    const [commentFocused, setCommentFocused] = useState(false);
    const [autoFocus, setAutoFocus] = useState(false);

    const {
        control,
        handleSubmit,
        resetField,
        watch,
        formState: { isValid },
    } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
    });

    const commentValue = watch('comment');

    useEffect(() => {
        if (setFocus) {
            setAutoFocus(true);
        }
    }, [setFocus]);

    const createComment = async ({ comment }: FormType) => {
        if (!user) return;

        const promise = gql.mutation({
            createComment: [
                {
                    data: {
                        goalId,
                        description: comment,
                        activityId: user.id,
                    },
                },
                {
                    id: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating new Comment'),
            success: t('Voila! Comment is here 🎉'),
        });

        const data = await promise;

        onCreate?.(data.createComment?.id);

        resetField('comment');
    };

    const onCommentBlur = useCallback(() => {
        setTimeout(() => {
            onBlur?.();
            setCommentFocused(false);
            setAutoFocus(false);
        }, 100);
    }, [onBlur]);

    const onCancelCreate = useCallback(() => {
        setTimeout(() => {
            setCommentFocused(false);
            setAutoFocus(false);
            resetField('comment');
        }, 100);
    }, [resetField]);

    return (
        <StyledComment>
            <UserPic size={32} src={user?.image} email={user?.email} />

            <StyledCommentForm tabIndex={0}>
                <Form onSubmit={handleSubmit(createComment)} submitHotkey={submitKeys}>
                    <Controller
                        name="comment"
                        control={control}
                        render={({ field }) => (
                            <FormEditor
                                {...field}
                                placeholder={t('Leave a comment')}
                                height={commentHeightMap[String(commentFocused)]}
                                onCancel={onCancelCreate}
                                onFocus={() => setCommentFocused(true)}
                                onBlur={onCommentBlur}
                                autoFocus={autoFocus}
                            />
                        )}
                    />

                    <FormActions>
                        <FormAction left inline />
                        <FormAction right inline>
                            {nullable(commentValue?.length, () => (
                                <Button size="m" text={t('Cancel')} onClick={onCancelCreate} />
                            ))}
                            <Button size="m" view="primary" type="submit" disabled={!isValid} text={t('Comment')} />
                        </FormAction>
                    </FormActions>
                </Form>

                <StyledFormBottom>
                    <StyledTip icon={<Icon type="markdown" size="s" color={gray6} />}>
                        {t('Styling with markdown is supported')}
                    </StyledTip>

                    <Link href={routes.help(locale, 'comments')}>
                        <Icon type="question" size="s" color={gray6} />
                    </Link>
                </StyledFormBottom>
            </StyledCommentForm>
        </StyledComment>
    );
};

export default CommentCreateForm;
