import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { Controller, Control } from 'react-hook-form';
import { backgroundColor, gapM, gray4 } from '@taskany/colors';
import { Button, Form, FormCard, FormAction, FormActions, nullable, useClickOutside } from '@taskany/bricks';

import { useLocale } from '../../hooks/useLocale';
import { FormEditor } from '../FormEditor/FormEditor';
import { HelpButton } from '../HelpButton/HelpButton';

import { tr } from './CommentForm.i18n';

interface CommentFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: Control<any>;
    actionButton: React.ReactNode;
    autoFocus?: boolean;
    height?: number;
    isValid?: boolean;
    error?: React.ComponentProps<typeof FormEditor>['error'];
    busy?: boolean;

    onSubmit?: () => void;
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
    autoFocus,
    control,
    actionButton,
    error,
    busy,
    onSubmit,
    onFocus,
    onCancel,
}) => {
    const locale = useLocale();
    const [commentFocused, setCommentFocused] = useState(false);
    const ref = useRef(null);

    const onCommentFocus = useCallback(() => {
        setCommentFocused(true);
        onFocus?.();
    }, [onFocus]);

    const onCommentCancel = useCallback(() => {
        setCommentFocused(false);
        onCancel?.();
    }, [onCancel]);

    const onCommentSubmit = useCallback(() => {
        setCommentFocused(false);
        onSubmit?.();
    }, [onSubmit]);

    useClickOutside(ref, () => {
        if (!Object.values(control._fields).some((v) => v?._f.value !== '')) {
            onCommentCancel();
        }
    });

    return (
        <StyledCommentForm ref={ref} tabIndex={0}>
            <Form onSubmit={onCommentSubmit}>
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
                                <Button size="m" outline text={tr('Cancel')} onClick={onCommentCancel} />
                            ))}

                            {actionButton}
                        </FormAction>
                    </FormActions>
                ))}
            </Form>
        </StyledCommentForm>
    );
};
