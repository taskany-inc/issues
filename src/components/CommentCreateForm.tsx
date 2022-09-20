import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Session } from 'next-auth';

import { gql } from '../utils/gql';
import { backgroundColor, gapS, gray4, gray6 } from '../design/@generated/themes';
import { TLocale } from '../types/locale';
import { routes } from '../hooks/router';

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
    user?: Session['user'];
    setFocus?: boolean;
    locale: TLocale;

    onCreate?: (CommentsId?: string) => void;
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

const CommentCreateForm: React.FC<CommentCreateFormProps> = ({ user, onCreate, goalId, setFocus, locale }) => {
    const t = useTranslations('Comments.new');

    const schema = z.object({
        comment: z
            .string({
                required_error: t("Comments's description is required"),
                invalid_type_error: t("Comments's description must be a string"),
            })
            .min(1, {
                message: t("Comments's description must be longer than 1 symbol"),
            }),
    });

    type FormType = z.infer<typeof schema>;

    const {
        control,
        handleSubmit,
        resetField,
        setFocus: setFieldFocus,
        formState: { errors, isValid, isSubmitted },
    } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
    });

    useEffect(() => {
        if (setFocus) {
            setFieldFocus('comment');
        }
    }, [setFocus, setFieldFocus]);

    const createComment = async ({ comment }: FormType) => {
        if (!user) return;

        const promise = gql.mutation({
            createComment: [
                {
                    goalId,
                    description: comment,
                    authorId: user.id,
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

        onCreate && onCreate(data.createComment?.id);

        resetField('comment');
    };

    return (
        <StyledComment>
            <UserPic size={32} src={user?.image} email={user?.email} />

            <StyledCommentForm>
                <Form onSubmit={handleSubmit(createComment)}>
                    {/* https://github.com/taskany-inc/issues/issues/234 t('Leave a comment') */}
                    <Controller
                        name="comment"
                        control={control}
                        render={({ field }) => <FormEditor height="60px" flat="both" {...field} />}
                    />

                    <FormActions>
                        <FormAction left inline />
                        <FormAction right inline>
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
