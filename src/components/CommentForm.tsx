import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Controller, Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { backgroundColor, gapS, gray4, gray6 } from '../design/@generated/themes';
import { submitKeys } from '../utils/hotkeys';
import { nullable } from '../utils/nullable';
import { usePageContext } from '../hooks/usePageContext';
import { routes } from '../hooks/router';

import { FormCard } from './FormCard';
import { Form } from './Form';
import { Icon } from './Icon';
import { FormAction, FormActions } from './FormActions';
import { Button } from './Button';
import { Tip } from './Tip';
import { Link } from './Link';
import { FormEditor } from './FormEditor';

interface CommentFormProps {
    i18nKeyset: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: Control<any>;
    autoFocus?: boolean;
    height?: string;
    isValid?: boolean;
    error?: React.ComponentProps<typeof FormEditor>['error'];

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
    i18nKeyset,
    autoFocus,
    height,
    control,
    error,
    isValid,
    onSubmit,
    onFocus,
    onCancel,
}) => {
    const t = useTranslations(i18nKeyset);
    const { locale } = usePageContext();
    const [commentFocused, setCommentFocused] = useState(false);

    const onCommentFocus = useCallback(() => {
        setCommentFocused(true);
        onFocus?.();
    }, [onFocus]);

    const onCommentCancel = useCallback(() => {
        setCommentFocused(false);
        onCancel?.();
    }, [onCancel]);

    return (
        <StyledCommentForm tabIndex={0}>
            <Form onSubmit={onSubmit} submitHotkey={submitKeys}>
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <FormEditor
                            {...field}
                            placeholder={t('Leave a comment')}
                            height={height}
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
                            <Button size="m" text={t('Cancel')} onClick={onCommentCancel} />
                            <Button size="m" view="primary" outline={!isValid} type="submit" text={t('Comment')} />
                        </FormAction>
                    </FormActions>
                ))}
            </Form>

            {nullable(commentFocused, () => (
                <StyledFormBottom>
                    <StyledTip icon={<Icon type="markdown" size="s" color={gray6} />}>
                        {t('Styling with markdown is supported')}
                    </StyledTip>

                    <Link href={routes.help(locale, 'comments')}>
                        <Icon type="question" size="s" color={gray6} />
                    </Link>
                </StyledFormBottom>
            ))}
        </StyledCommentForm>
    );
};
