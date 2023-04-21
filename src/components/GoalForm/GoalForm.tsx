import { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import styled from 'styled-components';
import { gapS, gray2 } from '@taskany/colors';
import {
    Button,
    Form,
    FormInput,
    FormActions,
    FormAction,
    FormEditor,
    FormTitle,
    ModalContent,
    ModalHeader,
    Tag,
} from '@taskany/bricks';

import { Project, EstimateInput, State, Tag as TagModel, Activity } from '../../../graphql/@generated/genql';
import { estimatedMeta } from '../../utils/dateTime';
import { submitKeys } from '../../utils/hotkeys';
import { errorsProvider } from '../../utils/forms';
import { usePageContext } from '../../hooks/usePageContext';
import { Priority } from '../../types/priority';
import { UserComboBox } from '../UserComboBox';
import { GoalParentComboBox } from '../GoalParentComboBox';
import { EstimateComboBox } from '../EstimateComboBox';
import { TagComboBox } from '../TagComboBox/TagComboBox';
import { StateDropdown } from '../StateDropdown';
import { PriorityDropdown } from '../PriorityDropdown';

import { tr } from './GoalForm.i18n';

const tagsLimit = 5;

const schemaProvider = () =>
    z.object({
        title: z
            .string({
                required_error: tr("Goal's title is required"),
                invalid_type_error: tr("Goal's title must be a string"),
            })
            .min(10, {
                message: tr("Goal's description must be longer than 10 symbols"),
            }),
        description: z
            .string({
                required_error: tr("Goal's description is required"),
                invalid_type_error: tr("Goal's description must be a string"),
            })
            .min(10, {
                message: tr("Goal's description must be longer than 10 symbols"),
            }),
        owner: z.object({
            id: z.string(),
        }),
        parent: z.object(
            {
                id: z.string(),
                title: z.string(),
                flowId: z.string(),
            },
            {
                invalid_type_error: tr("Goal's project or team are required"),
                required_error: tr("Goal's project or team are required"),
            },
        ),
        state: z.object({
            id: z.string(),
            hue: z.number(),
            title: z.string(),
        }),
        priority: z.string().nullable().optional(),
        estimate: z
            .object({
                date: z.string(),
                q: z.string(),
                y: z.string(),
            })
            .optional(),
        tags: z
            .array(
                z.object({
                    id: z.string(),
                    title: z.string(),
                }),
            )
            .optional(),
    });

export type GoalFormType = z.infer<ReturnType<typeof schemaProvider>>;

interface GoalFormProps {
    actionBtnText: string;
    formTitle: string;
    owner?: Partial<Activity>;
    title?: string;
    description?: string;
    parent?: Partial<Project>;
    tags?: Array<TagModel | undefined>;
    state?: Partial<State>;
    priority?: Priority | string;
    estimate?: EstimateInput;
    busy?: boolean;
    children?: React.ReactNode;

    onSumbit: (fields: GoalFormType) => void;
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
    actionBtnText,
    title,
    description,
    owner,
    parent,
    tags = [],
    state,
    priority,
    estimate,
    busy,
    children,
    onSumbit,
}) => {
    const schema = schemaProvider();
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
    } = useForm<GoalFormType>({
        resolver: zodResolver(schema),
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
        },
    });

    const parentWatcher = watch('parent');
    const tagsWatcher = watch('tags');
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
                <Form onSubmit={handleSubmit(onSumbit)} submitHotkey={submitKeys}>
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
                                        defaultValuePlaceholder={estimate ?? estimatedMeta({ locale })}
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
                        <FormAction right inline>
                            <Button
                                view="primary"
                                disabled={busy}
                                outline={!isValid}
                                type="submit"
                                text={actionBtnText}
                            />
                        </FormAction>
                    </FormActions>
                </Form>

                {children}
            </ModalContent>
        </>
    );
};
