import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nullable } from '@taskany/bricks';
import * as Sentry from '@sentry/nextjs';
import { Button, FormControl, FormControlInput, FormControlError, ModalContent } from '@taskany/bricks/harmony';

import { errorsProvider } from '../../utils/forms';
import { createFeedbackSchema, CreateFeedback } from '../../schema/feedback';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { notifyPromise } from '../../utils/notifyPromise';
import { trpc } from '../../utils/trpcClient';
import { FormControlEditor } from '../FormControlEditor/FormControlEditor';
import { FormActions, FormAction } from '../FormActions/FormActions';

import { tr } from './FeedbackCreateForm.i18n';

const FeedbackCreateForm: React.FC = () => {
    const [formBusy, setFormBusy] = useState(false);
    const createMutation = trpc.feedback.create.useMutation();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitted },
    } = useForm<CreateFeedback>({
        resolver: zodResolver(createFeedbackSchema),
        disabled: formBusy,
    });

    const errorsResolver = errorsProvider(errors, isSubmitted);

    const onPending = useCallback(
        async (form: CreateFeedback) => {
            setFormBusy(true);
            const res = await notifyPromise(
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
            <form onSubmit={handleSubmit(onPending, onError)}>
                <FormControl>
                    <FormControlInput
                        brick="bottom"
                        size="m"
                        {...register('title')}
                        placeholder={tr('Feedback title')}
                        autoFocus
                    />
                    {nullable(errorsResolver('title'), (error) => (
                        <FormControlError error={error} />
                    ))}
                </FormControl>

                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <FormControl>
                            <FormControlEditor
                                {...field}
                                height={100}
                                placeholder={tr("Feedback description. Say anything what's on your mind")}
                            />
                            {nullable(errorsResolver('description'), (error) => (
                                <FormControlError error={error} />
                            ))}
                        </FormControl>
                    )}
                />

                <FormActions>
                    <FormAction>
                        <Button text={tr('Cancel')} onClick={dispatchModalEvent(ModalEvent.FeedbackCreateModal)} />
                        <Button view="primary" type="submit" text={tr('Send feedback')} />
                    </FormAction>
                </FormActions>
            </form>
        </ModalContent>
    );
};

export default FeedbackCreateForm;
