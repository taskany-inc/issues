import React, { FormEvent, useCallback, useRef, useState } from 'react';
import { nullable, useClickOutside } from '@taskany/bricks';
import { Button, FormControl, FormControlError } from '@taskany/bricks/harmony';
import cn from 'classnames';

import { CommentSchema } from '../../schema/comment';
import { commentForm, commentFormDescription } from '../../utils/domObjects';
import { FormControlEditor } from '../FormControlEditor/FormControlEditor';
import { HelpButton } from '../HelpButton/HelpButton';
import { FormAction, FormActions } from '../FormActions/FormActions';

import { tr } from './CommentForm.i18n';
import s from './CommentForm.module.css';

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
    const [error, setError] = useState<{ message: string } | undefined>();
    const ref = useRef(null);

    const onDescriptionChange = useCallback(
        (descr = '') => {
            onChange?.({ description: descr });
        },
        [onChange],
    );

    const onCommentCancel = useCallback(() => {
        onCancel?.();
    }, [onCancel]);

    const onCommentSubmit = useCallback(
        (e: FormEvent<HTMLFormElement>) => {
            e?.preventDefault();
            onSubmit?.({ description });
        },
        [description, onSubmit],
    );

    useClickOutside(ref, () => {
        if (description === '') {
            onCancel?.();
        }
    });

    const onUploadFail = useCallback((errorMessage?: string) => {
        if (!errorMessage) return;
        setError({ message: errorMessage });
    }, []);

    return (
        <div className={cn(s.CommentFormWrapper, { [s.CommentFormWrapper_focused]: focused })} ref={ref} tabIndex={0}>
            <form onSubmit={onCommentSubmit} {...commentForm.attr}>
                <FormControl>
                    <FormControlEditor
                        disabled={busy}
                        placeholder={tr('Leave a comment')}
                        height={focused ? 120 : 80}
                        onCancel={onCommentCancel}
                        onFocus={onFocus}
                        onUploadFail={onUploadFail}
                        autoFocus={autoFocus}
                        value={description}
                        onChange={onDescriptionChange}
                        outline
                        {...commentFormDescription.attr}
                    />
                    {nullable(error, (err) => (
                        <FormControlError error={err} />
                    ))}
                </FormControl>

                {nullable(focused, () => (
                    <FormActions>
                        <div className={s.FormHelpButton}>
                            <HelpButton slug="comments" />
                        </div>
                        <FormAction>
                            {nullable(!busy, () => (
                                <Button text={tr('Cancel')} onClick={onCommentCancel} />
                            ))}

                            {actionButton}
                        </FormAction>
                    </FormActions>
                ))}
            </form>
        </div>
    );
};
