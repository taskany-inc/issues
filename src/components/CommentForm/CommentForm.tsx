import React, { useCallback, useRef, useState } from 'react';
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
    autoFocus?: boolean;
    height?: number;
    error?: React.ComponentProps<typeof FormEditor>['error'];
    id?: string;
    goalId?: string;
    stateId?: string;
    description?: string;

    renderActionButton: (props: { busy?: boolean }) => React.ReactNode;
    onSubmit?: (form: GoalCommentSchema) => void;
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
    error,
    renderActionButton,
    onSubmit,
    onFocus,
    onCancel,
}) => {
    const [commentFocused, setCommentFocused] = useState(false);
    const [busy, setBusy] = useState(false);
    const ref = useRef(null);

    const { control, handleSubmit, reset, register } = useForm<GoalCommentSchema>({
        resolver: zodResolver(goalCommentSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        values: {
            goalId,
            stateId,
            id,
            description,
        },
    });

    const onCommentFocus = useCallback(() => {
        setCommentFocused(true);
        onFocus?.();
    }, [onFocus]);

    const onCommentCancel = useCallback(() => {
        reset();
        setBusy(false);
        setCommentFocused(false);
        onCancel?.();
    }, [onCancel, reset]);

    const onCommentSubmit = useCallback(
        (form: GoalCommentSchema) => {
            setBusy(true);
            setCommentFocused(false);
            onSubmit?.(form);
            reset();
        },
        [onSubmit, reset],
    );

    useClickOutside(ref, () => {
        if (!Object.values(control._fields).some((v) => v?._f.value)) {
            onCommentCancel();
        }
    });

    return (
        <StyledCommentForm ref={ref} tabIndex={0}>
            <Form onSubmit={handleSubmit(onCommentSubmit)}>
                {nullable(id, () => (
                    <input type="hidden" value={id} {...register('id')} />
                ))}

                {nullable(goalId, () => (
                    <input type="hidden" value={goalId} {...register('goalId')} />
                ))}

                {nullable(stateId, () => (
                    <input type="hidden" value={stateId} {...register('stateId')} />
                ))}

                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <FormEditor
                            {...field}
                            disabled={busy}
                            placeholder={tr('Leave a comment')}
                            height={commentFocused ? 120 : 40}
                            onCancel={onCommentCancel}
                            onFocus={onCommentFocus}
                            autoFocus={autoFocus}
                            error={commentFocused ? error : undefined}
                        />
                    )}
                />

                {nullable(commentFocused, () => (
                    <FormActions>
                        <FormAction left inline>
                            {nullable(commentFocused, () => (
                                <StyledFormBottom>
                                    <HelpButton slug="comments" />
                                </StyledFormBottom>
                            ))}
                        </FormAction>
                        <FormAction right inline>
                            {nullable(!busy, () => (
                                <Button outline text={tr('Cancel')} onClick={onCommentCancel} />
                            ))}

                            {renderActionButton({ busy })}
                        </FormAction>
                    </FormActions>
                ))}
            </Form>
        </StyledCommentForm>
    );
};
