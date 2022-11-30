import React, { useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import styled from 'styled-components';

import { gql } from '../utils/gql';
import { submitKeys } from '../utils/hotkeys';
import { backgroundColor, gapS, gray4, gray6 } from '../design/@generated/themes';
import { routes } from '../hooks/router';
import { usePageContext } from '../hooks/usePageContext';

import { Form } from './Form';
import { FormCard } from './FormCard';
import { Icon } from './Icon';
import { FormAction, FormActions } from './FormActions';
import { Button } from './Button';
import { Tip } from './Tip';
import { Link } from './Link';
import { FormEditor } from './FormEditor';

interface CommentEditFormProps {
    id: string;
    description: string;
    setFocus?: boolean;

    onChanged?: (description: string) => void;
    onUpdate?: (id?: string, description?: string) => void;
    onCancel?: () => void;
}

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

const schemaProvider = (t: (key: string) => string) =>
    z.object({
        description: z
            .string({
                required_error: t("Comments's description is required"),
                invalid_type_error: t("Comments's description must be a string"),
            })
            .min(1, {
                message: t("Comments's description must be longer than 1 symbol"),
            }),
    });

type FormType = z.infer<ReturnType<typeof schemaProvider>>;

const CommentEditForm: React.FC<CommentEditFormProps> = ({ id, description, onChanged, onUpdate, onCancel }) => {
    const t = useTranslations('Comments.edit');
    const schema = schemaProvider(t);
    const { locale } = usePageContext();

    const {
        control,
        handleSubmit,
        watch,
        formState: { isValid },
    } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: {
            description,
        },
    });

    const newDescription = watch('description');
    const isUpdateAllowed = isValid && newDescription !== description;

    const updateComment = async ({ description }: FormType) => {
        onChanged?.(description);

        const promise = gql.mutation({
            updateComment: [
                {
                    data: {
                        id,
                        description,
                    },
                },
                {
                    id: true,
                    description: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating new Comment'),
            success: t('Voila! Comment is here 🎉'),
        });

        const data = await promise;

        onUpdate?.(data.updateComment?.id, data.updateComment?.description);
    };

    const onCancelEdit = useCallback(() => {
        onCancel?.();
    }, [onCancel]);

    return (
        <StyledCommentForm>
            <Form onSubmit={handleSubmit(updateComment)} submitHotkey={submitKeys}>
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <FormEditor
                            {...field}
                            placeholder={t('Leave a comment')}
                            height="120px"
                            autoFocus
                            onCancel={onCancelEdit}
                        />
                    )}
                />

                <FormActions>
                    <FormAction left inline />
                    <FormAction right inline>
                        <Button size="m" text={t('Cancel')} onClick={onCancelEdit} />
                        <Button size="m" view="primary" type="submit" disabled={!isUpdateAllowed} text={t('Save')} />
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
    );
};

export default CommentEditForm;
