import { useCallback, useMemo } from 'react';
import { Button, Form, FormAction, FormActions, FormTitle, ModalContent, ModalHeader, Text } from '@taskany/bricks';
import { warn0 } from '@taskany/colors';
import * as Sentry from '@sentry/nextjs';

import { FilterById } from '../../../trpc/inferredTypes';
import { useFilterResource } from '../../hooks/useFilterResource';

import { tr } from './FilterDeleteForm.i18n';

interface FilterDeleteFormProps {
    preset: FilterById;

    onSubmit: (preset: FilterById) => void;
    onCancel: () => void;
}

const FilterDeleteForm: React.FC<FilterDeleteFormProps> = ({ preset, onSubmit, onCancel }) => {
    const { deleteFilter } = useFilterResource();

    const onSubmitProvider = useCallback(
        (preset: FilterById) => async () => {
            const [data, err] = await deleteFilter(preset.id);

            if (data) {
                onSubmit(preset);
            } else if (err) {
                Sentry.captureException(err);
            }
        },
        [onSubmit, deleteFilter],
    );

    const onSubmitClick = useMemo(() => onSubmitProvider(preset), [onSubmitProvider, preset]);

    return (
        <>
            <ModalHeader>
                <FormTitle color={warn0}>{tr('You are trying to delete filters preset')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <Text>
                    {tr.raw('Are you sure to delete filters preset {preset}?', {
                        preset: <b key={preset.title}>{preset.title}</b>,
                    })}
                </Text>

                <br />

                <Form>
                    <FormActions flat="top">
                        <FormAction left />
                        <FormAction right inline>
                            <Button size="m" text={tr('Cancel')} onClick={onCancel} />
                            <Button size="m" view="warning" onClick={onSubmitClick} text={tr('Yes, delete it')} />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </>
    );
};

export default FilterDeleteForm;
