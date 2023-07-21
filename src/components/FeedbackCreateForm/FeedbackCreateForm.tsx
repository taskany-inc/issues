import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, FormActions, FormAction, FormTextarea, FormInput, ModalContent } from '@taskany/bricks';
import * as Sentry from '@sentry/nextjs';

import { errorsProvider } from '../../utils/forms';
import { createFeedbackSchema, CreateFeedback } from '../../schema/feedback';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { notifyPromise } from '../../utils/notifyPromise';
import { trpc } from '../../utils/trpcClient';

import { tr } from './FeedbackCreateForm.i18n';

const FeedbackCreateForm: React.FC = () => {
    const [formBusy, setFormBusy] = useState(false);
    const createMutation = trpc.feedback.create.useMutation();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitted },
    } = useForm<CreateFeedback>({
        resolver: zodResolver(createFeedbackSchema),
    });

    const errorsResolver = errorsProvider(errors, isSubmitted);

    const onPending = useCallback(
        async (form: CreateFeedback) => {
            setFormBusy(true);
            const [res] = await notifyPromise(
                createMutation.mutateAsync({
                    title: form.title,
                    description: form.description,
                    href: window.location.href,
                }),
                'sentFeedback',
            );
            if (res) {
                dispatchModalEvent(ModalEvent.FeedbackCreateModal)();
            }

            setFormBusy(false);
        },
        [createMutation],
    );

    const onError = useCallback((err: typeof errors) => {
        Sentry.captureException(err);
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
                    placeholder={tr("Feedback description. Say anything what's on your mind")}
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
