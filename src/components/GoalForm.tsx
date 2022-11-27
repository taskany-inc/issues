import { useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import styled from 'styled-components';

import { TLocale } from '../types/locale';
import { gapS } from '../design/@generated/themes';
import { Project, EstimateInput, State, Tag as TagModel, Activity, Priority } from '../../graphql/@generated/genql';
import { estimatedMeta } from '../utils/dateTime';
import { submitKeys } from '../utils/hotkeys';
import { errorsProvider } from '../utils/forms';

import { Button } from './Button';
import { FormInput } from './FormInput';
import { FormActions, FormAction } from './FormActions';
import { Form } from './Form';
import { UserComboBox } from './UserComboBox';
import { ProjectComboBox } from './ProjectComboBox';
import { EstimateComboBox } from './EstimateComboBox';
import { TagComboBox } from './TagComboBox';
import { StateDropdown } from './StateDropdown';
import { PriorityDropdown } from './PriorityDropdown';
import { Tag } from './Tag';
import { FormEditor } from './FormEditor';

const tagsLimit = 5;

const schemaProvider = (t: (key: string) => string) =>
    z.object({
        title: z
            .string({
                required_error: t("Goal's title is required"),
                invalid_type_error: t("Goal's title must be a string"),
            })
            .min(10, {
                message: t("Goal's title must be longer than 10 symbols"),
            }),
        description: z
            .string({
                required_error: t("Goal's description is required"),
                invalid_type_error: t("Goal's description must be a string"),
            })
            .min(10, {
                message: t("Goal's description must be longer than 10 symbols"),
            }),
        owner: z.object({
            id: z.string(),
        }),
        project: z.object(
            {
                id: z.number(),
                title: z.string(),
                flowId: z.string(),
            },
            {
                invalid_type_error: "Goal's project is required",
                required_error: "Goal's project is required",
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
    formTitle: string;
    owner?: Partial<Activity>;
    i18nKeyset: string;
    locale: TLocale;
    title?: string;
    description?: string;
    project?: Partial<Project>;
    tags?: Array<TagModel | undefined>;
    state?: Partial<State>;
    priority?: Priority | string;
    estimate?: EstimateInput;
    children?: React.ReactNode;

    onSumbit: (fields: GoalFormType) => void;
}

const StyledTagsContainer = styled.div`
    padding-left: ${gapS};
`;

export const GoalForm: React.FC<GoalFormProps> = ({
    formTitle,
    title,
    description,
    owner,
    project,
    tags = [],
    state,
    priority,
    estimate,
    i18nKeyset,
    locale,
    children,
    onSumbit,
}) => {
    const t = useTranslations(i18nKeyset);
    const schema = schemaProvider(t);

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
        shouldFocusError: true,
        defaultValues: {
            title,
            description,
            owner,
            project,
            state,
            priority,
            estimate,
            tags,
        },
    });

    const projectWatcher = watch('project');
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
            <h2>{formTitle}</h2>

            <Form onSubmit={handleSubmit(onSumbit)} submitHotkey={submitKeys}>
                <FormInput
                    {...register('title')}
                    error={errorsResolver('title')}
                    placeholder={t("Goal's title")}
                    autoFocus
                    flat="bottom"
                />

                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <FormEditor
                            flat="both"
                            placeholder={t('And its description')}
                            error={errorsResolver(field.name)}
                            {...field}
                        />
                    )}
                />

                <StyledTagsContainer>
                    {tagsWatcher?.map((tag) => (
                        <Tag key={tag.id} title={tag.title} onHide={onTagDeleteProvider(tag)} />
                    ))}
                </StyledTagsContainer>

                <FormActions flat="top">
                    <FormAction left inline>
                        <Controller
                            name="owner"
                            control={control}
                            render={({ field }) => (
                                <UserComboBox
                                    text={t('Assign')}
                                    placeholder={t('Enter project title')}
                                    error={errorsResolver(field.name)}
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="project"
                            control={control}
                            render={({ field }) => (
                                <ProjectComboBox
                                    text={t('Enter project title')}
                                    placeholder={t('Enter project title')}
                                    error={errorsResolver(field.name)}
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="state"
                            control={control}
                            render={({ field }) => (
                                <StateDropdown
                                    text={t('State')}
                                    flowId={projectWatcher?.flowId}
                                    error={errorsResolver(field.name)}
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="priority"
                            control={control}
                            render={({ field }) => (
                                <PriorityDropdown
                                    text={t('Priority.Priority')}
                                    error={errorsResolver(field.name)}
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="estimate"
                            control={control}
                            render={({ field }) => (
                                <EstimateComboBox
                                    locale={locale}
                                    text={t('Schedule')}
                                    placeholder={t('Date input mask placeholder')}
                                    mask={t('Date input mask')}
                                    defaultValuePlaceholder={estimate ?? estimatedMeta({ locale })}
                                    error={errorsResolver(field.name)}
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="tags"
                            control={control}
                            render={({ field }) => (
                                <TagComboBox
                                    text="Tags"
                                    disabled={(tagsWatcher || []).length >= tagsLimit}
                                    placeholder={t('Enter tag title')}
                                    error={errorsResolver(field.name)}
                                    {...field}
                                />
                            )}
                        />
                    </FormAction>
                    <FormAction right inline>
                        <Button view="primary" outline={!isValid} type="submit" text={t('Submit')} />
                    </FormAction>
                </FormActions>
            </Form>

            {children}
        </>
    );
};
