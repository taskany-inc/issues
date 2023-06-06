import { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Schema, z } from 'zod';
import styled from 'styled-components';
import { gapS, gray2 } from '@taskany/colors';
import { Form, FormInput, FormActions, FormAction, FormTitle, ModalContent, ModalHeader, Tag } from '@taskany/bricks';
import { Estimate, State, Tag as TagModel } from '@prisma/client';

import { FormEditor } from '../FormEditor/FormEditor';
import { estimatedMeta } from '../../utils/dateTime';
import { errorsProvider } from '../../utils/forms';
import { usePageContext } from '../../hooks/usePageContext';
import { Priority } from '../../types/priority';
import { UserComboBox } from '../UserComboBox';
import { GoalParentComboBox } from '../GoalParentComboBox';
import { EstimateComboBox } from '../EstimateComboBox';
import { TagComboBox } from '../TagComboBox';
import { StateDropdown } from '../StateDropdown';
import { PriorityDropdown } from '../PriorityDropdown';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';

import { tr } from './GoalForm.i18n';

const tagsLimit = 5;
interface GoalFormProps {
    formTitle: string;
    owner?: ActivityByIdReturnType;
    title?: string;
    description?: string;
    parent?: { id: string; title: string; flowId: string; description?: string | null };
    tags?: TagModel[];
    state?: State;
    priority?: Priority | string;
    estimate?: Estimate;
    busy?: boolean;
    children?: React.ReactNode;
    validityScheme: Schema;
    id?: string;

    onSumbit: (fields: z.infer<GoalFormProps['validityScheme']>) => void;
    renderActionButton: (props: { busy: boolean; isValid: boolean }) => React.ReactNode;
}

const StyledTagsContainer = styled.div<{ focused?: boolean }>`
    padding-top: 45px;
    padding-left: ${gapS};

    ${({ focused }) =>
        focused &&
        `
            background-color: ${gray2};
        `}
`;

export const GoalForm: React.FC<GoalFormProps> = ({
    formTitle,
    id,
    title,
    description,
    owner,
    parent,
    tags = [],
    state,
    priority,
    estimate,
    busy,
    validityScheme,
    children,
    onSumbit,
    renderActionButton,
}) => {
    const { locale } = usePageContext();
    const [descriptionFocused, setDescriptionFocused] = useState(false);

    const onDescriptionFocus = useCallback(() => {
        setDescriptionFocused(true);
    }, []);

    const onDescriptionCancel = useCallback(() => {
        setDescriptionFocused(false);
    }, []);

    const {
        control,
        register,
        handleSubmit,
        watch,
        setFocus,
        setValue,
        formState: { errors, isValid, isSubmitted },
    } = useForm<z.infer<typeof validityScheme>>({
        resolver: zodResolver(validityScheme),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: false,
        defaultValues: {
            title,
            description,
            owner,
            parent,
            state,
            priority,
            estimate,
            tags,
            id,
        },
    });

    const parentWatcher = watch('parent');
    const tagsWatcher: TagModel[] = watch('tags');
    const errorsResolver = errorsProvider(errors, isSubmitted);

    useEffect(() => {
        setTimeout(() => setFocus('title'), 0);
    }, [setFocus]);

    const onTagDeleteProvider = useCallback(
        (tag: Partial<TagModel>) => () => {
            const tags = tagsWatcher?.filter((t) => t.id !== tag.id);
            setValue('tags', tags);
        },
        [setValue, tagsWatcher],
    );

    return (
        <>
            <ModalHeader>
                <FormTitle>{formTitle}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={handleSubmit(onSumbit)}>
                    <FormInput
                        {...register('title')}
                        error={errorsResolver('title')}
                        placeholder={tr("Goal's title")}
                        autoFocus
                        flat="bottom"
                        disabled={busy}
                    />

                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <FormEditor
                                flat="both"
                                placeholder={tr('And its description')}
                                error={errorsResolver(field.name)}
                                onFocus={onDescriptionFocus}
                                onCancel={onDescriptionCancel}
                                disabled={busy}
                                {...field}
                            />
                        )}
                    />

                    <StyledTagsContainer focused={descriptionFocused}>
                        {tagsWatcher?.map((tag) => (
                            <Tag key={tag.id} title={tag.title} onHide={onTagDeleteProvider(tag)} />
                        ))}
                    </StyledTagsContainer>

                    <FormActions flat="top" focused={descriptionFocused}>
                        <FormAction left inline>
                            <Controller
                                name="parent"
                                control={control}
                                render={({ field }) => (
                                    <GoalParentComboBox
                                        text={tr('Enter project or team title')}
                                        placeholder={tr('Enter project or team title')}
                                        error={errorsResolver(field.name)}
                                        disabled={busy}
                                        {...field}
                                    />
                                )}
                            />

                            <Controller
                                name="priority"
                                control={control}
                                render={({ field }) => (
                                    <PriorityDropdown
                                        text={tr('Priority')}
                                        error={errorsResolver(field.name)}
                                        disabled={busy}
                                        {...field}
                                    />
                                )}
                            />

                            <Controller
                                name="owner"
                                control={control}
                                render={({ field }) => (
                                    <UserComboBox
                                        text={tr('Assign')}
                                        placeholder={tr('Enter name or email')}
                                        error={errorsResolver(field.name)}
                                        disabled={busy}
                                        {...field}
                                    />
                                )}
                            />

                            <Controller
                                name="estimate"
                                control={control}
                                render={({ field }) => (
                                    <EstimateComboBox
                                        placeholder={tr('Date input mask placeholder')}
                                        mask={tr('Date input mask')}
                                        defaultValuePlaceholder={estimatedMeta({ locale })}
                                        error={errorsResolver(field.name)}
                                        disabled={busy}
                                        {...field}
                                    />
                                )}
                            />

                            <Controller
                                name="state"
                                control={control}
                                render={({ field }) => (
                                    <StateDropdown
                                        text={tr('State')}
                                        flowId={parentWatcher?.flowId}
                                        error={errorsResolver(field.name)}
                                        disabled={busy}
                                        {...field}
                                    />
                                )}
                            />

                            <Controller
                                name="tags"
                                control={control}
                                render={({ field }) => (
                                    <TagComboBox
                                        disabled={busy || (tagsWatcher || []).length >= tagsLimit}
                                        placeholder={tr('Enter tag title')}
                                        error={errorsResolver(field.name)}
                                        {...field}
                                    />
                                )}
                            />
                        </FormAction>
                        {renderActionButton({ busy: Boolean(busy), isValid: Boolean(isValid) })}
                    </FormActions>
                </Form>

                {children}
            </ModalContent>
        </>
    );
};
