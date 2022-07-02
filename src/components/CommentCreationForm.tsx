import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Session } from 'next-auth';

import { gql } from '../utils/gql';
import { backgroundColor, gray4, gray6 } from '../design/@generated/themes';

import { Form } from './Form';
import { FormCard } from './FormCard';
import { FormTextarea } from './FormTextarea';
import { UserPic } from './UserPic';
import { Icon } from './Icon';
import { Text } from './Text';
import { FormAction } from './FormActions';
import { Button } from './Button';
import { Tip } from './Tip';
import { Link } from './Link';

interface CommentProps {
    goalId: string;
    onCreate?: (CommentsId?: string) => void;
    user?: Session['user'];
}

const StyledComment = styled.div`
    display: grid;
    grid-template-columns: 35px 1fr;
    column-gap: 15px;
`;

const StyledUserPic = styled.div`
    padding-top: 11px;
`;

const StyledFormBottom = styled.div`
    padding-left: 14px;
    padding-top: 9px;
    display: grid;
    grid-template-columns: 1fr 15px;
    column-gap: 5px;
    align-items: center;
`;

const StyledCommentForm = styled(FormCard)`
    position: relative;
    z-index: 2;
    &::before {
        position: absolute;
        content: '';
        width: 20px;
        height: 20px;
        background-color: ${backgroundColor};
        border-left: 1px solid ${gray4};
        border-top: 1px solid ${gray4};
        border-radius: 2px;
        z-index: 3;
        transform: rotate(-45deg);
        top: 14px;
        left: -10px;
    }
`;

const StyledTip = styled(Tip)`
    padding: 0;
`;

const StyledFormTextarea = styled(FormTextarea)`
    min-height: 100px;
`;

export const CommentCreationForm: React.FC<CommentProps> = ({ user, onCreate, goalId }) => {
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
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitted },
    } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
    });

    const createComment = async ({ comment }: FormType) => {
        if (!user) return;

        const promise = gql.mutation({
            createComment: [
                {
                    description: comment,
                    goalId,
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

        await promise;

        onCreate && onCreate();
    };

    return (
        <StyledComment>
            <StyledUserPic>
                <UserPic size={32} src={user?.image} />
            </StyledUserPic>
            <StyledCommentForm>
                <Form onSubmit={handleSubmit(createComment)}>
                    <StyledFormTextarea
                        {...register('comment')}
                        error={isSubmitted ? errors.comment : undefined}
                        placeholder={t('Leave a comment')}
                        flat="both"
                    />
                    <FormAction right inline>
                        <Button size="m" view="primary" type="submit" disabled={!isValid} text={t('Comment')} />
                    </FormAction>
                </Form>
                <StyledFormBottom>
                    <StyledTip icon={<Icon type="markdown" size="s" color={gray6} />}>
                        <Text as="span" color={gray6}>
                            {t('Styling with markdown is supported')}
                        </Text>
                    </StyledTip>
                    <Link href="/help">
                        <Icon type="question" size="s" color={gray6} />
                    </Link>
                </StyledFormBottom>
            </StyledCommentForm>
        </StyledComment>
    );
};
