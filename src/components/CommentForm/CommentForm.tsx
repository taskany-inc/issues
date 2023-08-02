import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { backgroundColor, gapM, gray4 } from '@taskany/colors';
import { Button, Form, FormCard, FormAction, FormActions, nullable, useClickOutside } from '@taskany/bricks';

import { GoalCommentSchema, goalCommentSchema } from '../../schema/goal';
import { FormEditor } from '../FormEditor/FormEditor';
import { HelpButton } from '../HelpButton/HelpButton';

import { tr } from './CommentForm.i18n';

interface CommentFormProps {
    actionButton: React.ReactNode;
    focused?: boolean;
    autoFocus?: boolean;
    busy?: boolean;
    height?: number;
    error?: React.ComponentProps<typeof FormEditor>['error'];
    id?: string;
    goalId?: string;
    stateId?: string;
    description?: string;

    onDescriptionChange: (description: string) => void;
    onSubmit: (form: GoalCommentSchema) => void | Promise<void>;
    onFocus?: () => void;
    onCancel?: () => void;
}

const StyledFormBottom = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding-top: ${gapM};
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

export const CommentForm: React.FC<CommentFormProps> = ({
    id,
    goalId,
    stateId,
    description = '',
    autoFocus,
    focused,
    busy,
    error,
    actionButton,
    onDescriptionChange,
    onSubmit,
    onFocus,
    onCancel,
}) => {
    const ref = useRef(null);

    const { control, handleSubmit, register, watch } = useForm<GoalCommentSchema>({
        resolver: zodResolver(goalCommentSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        values: {
            id,
            goalId,
            stateId,
            description,
        },
    });

    const descriptionWatcher = watch('description');

    useEffect(() => {
        onDescriptionChange(descriptionWatcher);
    }, [descriptionWatcher, onDescriptionChange]);

    useClickOutside(ref, () => {
        if (!Object.values(control._fields).some((v) => v?._f.value)) {
            onCancel?.();
        }
    });

    return (
        <StyledCommentForm ref={ref} tabIndex={0}>
            <Form onSubmit={handleSubmit(onSubmit)}>
                {nullable(id, () => (
                    <input type="hidden" {...register('id')} />
                ))}

                {nullable(goalId, () => (
                    <input type="hidden" {...register('goalId')} />
                ))}

                {nullable(stateId, () => (
                    <input type="hidden" {...register('stateId')} />
                ))}

                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <FormEditor
                            {...field}
                            disabled={busy}
                            placeholder={tr('Leave a comment')}
                            height={focused ? 120 : 40}
                            onCancel={onCancel}
                            onFocus={onFocus}
                            autoFocus={autoFocus}
                            error={focused ? error : undefined}
                        />
                    )}
                />

                {nullable(focused, () => (
                    <FormActions>
                        <FormAction left inline>
                            {nullable(focused, () => (
                                <StyledFormBottom>
                                    <HelpButton slug="comments" />
                                </StyledFormBottom>
                            ))}
                        </FormAction>
                        <FormAction right inline>
                            {nullable(!busy, () => (
                                <Button outline text={tr('Cancel')} onClick={onCancel} />
                            ))}

                            {actionButton}
                        </FormAction>
                    </FormActions>
                ))}
            </Form>
        </StyledCommentForm>
    );
};
