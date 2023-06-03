import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { Controller, Control } from 'react-hook-form';
import { backgroundColor, gapS, gray4, gray6 } from '@taskany/colors';
import {
    Button,
    Link,
    Form,
    FormCard,
    FormAction,
    FormActions,
    MarkdownIcon,
    QuestionIcon,
    nullable,
} from '@taskany/bricks';

import { usePageContext } from '../../hooks/usePageContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { routes } from '../../hooks/router';
import { FormEditor } from '../FormEditor/FormEditor';
import { Tip } from '../Tip';

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
    const { locale } = usePageContext();
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
                            height={commentFocused ? 120 : 60}
                            onCancel={onCommentCancel}
                            onFocus={onCommentFocus}
                            autoFocus={autoFocus}
                            error={commentFocused ? error : undefined}
                        />
                    )}
                />

                {nullable(commentFocused, () => (
                    <FormActions focused={commentFocused}>
                        <FormAction left inline />
                        <FormAction right inline>
                            {nullable(!busy, () => (
                                <Button size="m" outline text={tr('Cancel')} onClick={onCommentCancel} />
                            ))}

                            {actionButton}
                        </FormAction>
                    </FormActions>
                ))}
            </Form>

            {nullable(commentFocused, () => (
                <StyledFormBottom>
                    <StyledTip icon={<MarkdownIcon size="s" color={gray6} />}>{tr('Markdown supported')}</StyledTip>
                    <Link href={routes.help(locale, 'comments')}>
                        <QuestionIcon size="s" color={gray6} />
                    </Link>
                </StyledFormBottom>
            ))}
        </StyledCommentForm>
    );
};
