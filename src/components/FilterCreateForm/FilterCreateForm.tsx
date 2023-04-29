import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Form,
    FormActions,
    FormAction,
    FormTextarea,
    FormInput,
    FormTitle,
    ModalHeader,
    ModalContent,
} from '@taskany/bricks';

import { errorsProvider } from '../../utils/forms';
import { createFilterSchema, CreateFilter } from '../../schema/filter';
import { Nullish, Void } from '../../types/void';
import { FilterById } from '../../../trpc/inferredTypes';
import { useFilterResource } from '../../hooks/useFilterResource';

import { tr } from './FilterCreateForm.i18n';

interface FilterCreateFormProps {
    mode: CreateFilter['mode'];
    params: CreateFilter['params'];

    onSubmit?: Void<Nullish<FilterById>>;
}

const FilterCreateForm: React.FC<FilterCreateFormProps> = ({ mode, params, onSubmit }) => {
    const { createFilter } = useFilterResource();
    const [formBusy, setFormBusy] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitted },
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
                onSubmit?.(data);
            }
        },
        [createFilter, onSubmit],
    );

    const onError = useCallback((err: typeof errors) => {
        // TODO: Sentry event
    }, []);

    return (
        <>
            <ModalHeader>
                <FormTitle>{tr('New filters preset')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <Form disabled={formBusy} onSubmit={handleSubmit(onPending, onError)}>
                    <FormInput
                        {...register('title')}
                        placeholder={tr('Title')}
                        flat="bottom"
                        brick="right"
                        error={errorsResolver('title')}
                    />

                    <FormTextarea
                        {...register('description')}
                        placeholder={tr('Description')}
                        flat="both"
                        error={errorsResolver('description')}
                    />

                    <FormActions flat="top">
                        <FormAction left inline />
                        <FormAction right inline>
                            <Button view="primary" outline={!isValid} type="submit" text={tr('Create filter')} />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </>
    );
};

export default FilterCreateForm;
