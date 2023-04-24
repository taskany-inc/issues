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
import { CreateFormType, createSchema } from '../../schema/filter';
import { Filter, FilterCreateInput } from '../../../graphql/@generated/genql';
import { useFilterResource } from '../../hooks/useFilterResource';
import { Void } from '../../types/void';

import { tr } from './FilterCreateForm.i18n';

interface FilterCreateFormProps {
    mode: FilterCreateInput['mode'];
    params: FilterCreateInput['params'];

    onSubmit?: Void<Partial<Filter>>;
}

const FilterCreateForm: React.FC<FilterCreateFormProps> = ({ mode, params, onSubmit }) => {
    const { createFilter } = useFilterResource();
    const [formBusy, setFormBusy] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitted },
    } = useForm<CreateFormType>({
        resolver: zodResolver(createSchema),
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
        async (form: CreateFormType) => {
            setFormBusy(true);

            const [data, err] = await createFilter(form);

            if (data && data.createFilter && !err) {
                onSubmit?.(data.createFilter);
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
