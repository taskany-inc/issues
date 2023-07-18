import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, FormActions, FormAction, FormTextarea, FormInput, ModalContent } from '@taskany/bricks';

import { errorsProvider } from '../../utils/forms';
import { createFeedbackSchema, CreateFeedback } from '../../schema/feedback';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';

import { tr } from './FeedbackCreateForm.i18n';

const FeedbackCreateForm: React.FC = () => {
    const [formBusy, setFormBusy] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitted },
    } = useForm<CreateFeedback>({
        resolver: zodResolver(createFeedbackSchema),
    });

    const errorsResolver = errorsProvider(errors, isSubmitted);

    const onPending = useCallback((form: CreateFeedback) => {
        setFormBusy(true);
        fetch('/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                title: form.title,
                description: form.description,
                href: window.location.href,
            }),
        });
        dispatchModalEvent(ModalEvent.FeedbackCreateModal)();
    }, []);

    const onError = useCallback((err: typeof errors) => {
        // TODO: Sentry event
    }, []);

    return (
        <ModalContent>
            <Form disabled={formBusy} onSubmit={handleSubmit(onPending, onError)}>
                <FormInput
                    {...register('title')}
                    placeholder={tr('Feedback title')}
                    flat="bottom"
                    brick="right"
                    error={errorsResolver('title')}
                />

                <FormTextarea
                    {...register('description')}
                    minHeight={100}
                    placeholder={tr('Feedback description. Say anythink what on your mind')}
                    flat="both"
                    error={errorsResolver('description')}
                />

                <FormActions flat="top">
                    <FormAction left inline />
                    <FormAction right inline>
                        <Button outline text={'Cancel'} onClick={dispatchModalEvent(ModalEvent.FeedbackCreateModal)} />
                        <Button view="primary" outline type="submit" text={tr('Send feedback')} />
                    </FormAction>
                </FormActions>
            </Form>
        </ModalContent>
    );
};

export default FeedbackCreateForm;
