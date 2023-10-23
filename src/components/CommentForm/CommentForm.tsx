import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { backgroundColor, gapM, gray4 } from '@taskany/colors';
import { Button, Form, FormCard, FormAction, FormActions, nullable, useClickOutside } from '@taskany/bricks';

import { CommentSchema } from '../../schema/comment';
import { commentForm, commentFormDescription } from '../../utils/domObjects';
import { FormEditor } from '../FormEditor/FormEditor';
import { HelpButton } from '../HelpButton/HelpButton';

import { tr } from './CommentForm.i18n';

interface CommentFormProps {
    actionButton: React.ReactNode;
    focused?: boolean;
    autoFocus?: boolean;
    busy?: boolean;
    description?: string;

    onSubmit: (form: CommentSchema) => void | Promise<void>;
    onChange?: (form: CommentSchema) => void;
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
    description = '',
    autoFocus,
    focused,
    busy,
    actionButton,
    onChange,
    onSubmit,
    onFocus,
    onCancel,
}) => {
    const ref = useRef(null);
    const [newDescription, setNewDescription] = useState(description);

    const onDescriptionChange = useCallback(
        (descr = '') => {
            setNewDescription(descr);
            onChange?.({ description: descr });
        },
        [onChange],
    );

    const onCommentCancel = useCallback(() => {
        setNewDescription('');
        onCancel?.();
    }, [onCancel]);

    const onCommentSubmit = useCallback(() => {
        onSubmit?.({ description: newDescription });
        setNewDescription('');
    }, [onSubmit, newDescription]);

    useClickOutside(ref, () => {
        if (newDescription === '') {
            onCancel?.();
        }
    });

    return (
        <StyledCommentForm ref={ref} tabIndex={0}>
            <Form onSubmit={onCommentSubmit} {...commentForm.attr}>
                <FormEditor
                    disabled={busy}
                    placeholder={tr('Leave a comment')}
                    height={focused ? 120 : 40}
                    onCancel={onCommentCancel}
                    onFocus={onFocus}
                    autoFocus={autoFocus}
                    value={newDescription}
                    onChange={onDescriptionChange}
                    {...commentFormDescription.attr}
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
