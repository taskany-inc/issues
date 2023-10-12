import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, FormActions, FormAction, FormTextarea, FormInput, ModalContent } from '@taskany/bricks';
import * as Sentry from '@sentry/nextjs';

import { errorsProvider } from '../../utils/forms';
import { createFilterSchema, CreateFilter } from '../../schema/filter';
import { useFilterResource } from '../../hooks/useFilterResource';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';

import { tr } from './FilterCreateForm.i18n';

interface FilterCreateFormProps {
    mode: CreateFilter['mode'];
    params: CreateFilter['params'];

    onSubmit?: (id: string) => void;
}

const FilterCreateForm: React.FC<FilterCreateFormProps> = ({ mode, params, onSubmit }) => {
    const { createFilter } = useFilterResource();
    const [formBusy, setFormBusy] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitted },
    } = useForm<CreateFilter>({
        resolver: zodResolver(createFilterSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: {
            mode,
            params,
        },
    });

    const errorsResolver = errorsProvider(errors, isSubmitted);

    const onPending = useCallback(
        async (form: CreateFilter) => {
            setFormBusy(true);

            const [data, err] = await createFilter(form);

            if (data && !err) {
                onSubmit?.(data.id);
            }
        },
        [createFilter, onSubmit],
    );

    const onError = useCallback((err: typeof errors) => {
        Sentry.captureException(err);
    }, []);

    return (
        <>
            <ModalContent>
                <Form disabled={formBusy} onSubmit={handleSubmit(onPending, onError)}>
                    <FormInput
                        {...register('title')}
                        placeholder={tr('Preset title')}
                        flat="bottom"
                        brick="right"
                        error={errorsResolver('title')}
                    />

                    <FormTextarea
                        {...register('description')}
                        minHeight={100}
                        placeholder={tr('Preset description')}
                        flat="both"
                        error={errorsResolver('description')}
                    />

                    <FormActions flat="top">
                        <FormAction left inline />
                        <FormAction right inline>
                            <Button
                                outline
                                text={tr('Cancel')}
                                onClick={dispatchModalEvent(ModalEvent.FilterCreateModal)}
                            />
                            <Button view="primary" outline type="submit" text={tr('Create preset')} />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </>
    );
};

export default FilterCreateForm;
