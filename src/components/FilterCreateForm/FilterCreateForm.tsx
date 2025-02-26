import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nullable } from '@taskany/bricks';
import * as Sentry from '@sentry/nextjs';
import {
    ModalContent,
    Button,
    FormControl,
    FormControlInput,
    FormControlError,
    FormControlEditor,
} from '@taskany/bricks/harmony';

import { errorsProvider } from '../../utils/forms';
import { createFilterSchema, CreateFilter } from '../../schema/filter';
import { useFilterResource } from '../../hooks/useFilterResource';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { FormAction, FormActions } from '../FormActions/FormActions';
import { useRouter } from '../../hooks/router';

import { tr } from './FilterCreateForm.i18n';

interface FilterCreateFormProps {
    mode: CreateFilter['mode'];
    params: CreateFilter['params'];

    onSubmit?: (id: string) => void;
}

const FilterCreateForm: React.FC<FilterCreateFormProps> = ({ mode, params, onSubmit }) => {
    const { createFilter } = useFilterResource();
    const [formBusy, setFormBusy] = useState(false);

    const { appRouter } = useRouter();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitted },
    } = useForm<CreateFilter>({
        disabled: formBusy,
        resolver: zodResolver(createFilterSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: {
            mode,
            params,
            target: appRouter.asPath.split('?')[0] ?? '',
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
                <form onSubmit={handleSubmit(onPending, onError)}>
                    <FormControl>
                        <FormControlInput
                            brick="bottom"
                            size="m"
                            {...register('title')}
                            placeholder={tr('Preset title')}
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
                                <FormControlEditor {...field} height={100} placeholder={tr('Preset description')} />
                                {nullable(errorsResolver('description'), (error) => (
                                    <FormControlError error={error} />
                                ))}
                            </FormControl>
                        )}
                    />

                    <FormActions>
                        <FormAction>
                            <Button text={tr('Cancel')} onClick={dispatchModalEvent(ModalEvent.FilterCreateModal)} />
                            <Button view="primary" type="submit" text={tr('Create preset')} />
                        </FormAction>
                    </FormActions>
                </form>
            </ModalContent>
        </>
    );
};

export default FilterCreateForm;
