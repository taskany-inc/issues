import { useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

import { gapS } from '../design/@generated/themes';
import { Project, EstimateInput, State, Tag as TagModel, Activity, Priority } from '../../graphql/@generated/genql';
import { estimatedMeta } from '../utils/dateTime';

import { Button } from './Button';
import { FormInput } from './FormInput';
import { FormActions, FormAction } from './FormActions';
import { Form } from './Form';
import { ProjectCompletion } from './ProjectCompletion';
import { TagCompletion } from './TagCompletion';
import { StateDropdown } from './StateDropdown';
import { PriorityDropdown } from './PriorityDropdown';
import { UserPic } from './UserPic';
import { Tag } from './Tag';
import { FormEditor } from './FormEditor';

const EstimateDropdown = dynamic(() => import('./EstimateDropdown'));
const UserCompletionDropdown = dynamic(() => import('./UserCompletionDropdown'));

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
    });

export type GoalFormType = z.infer<ReturnType<typeof schemaProvider>>;

interface GoalFormProps {
    formTitle: string;
    owner: Activity;
    i18nKeyset: string;
    locale: 'en' | 'ru';
    title?: string;
    description?: string;
    project?: Project;
    tags?: Map<string, TagModel>;
    state?: State;
    priority?: Priority;
    estimate?: EstimateInput;
    children?: React.ReactNode;

    onSumbit: (fields: GoalFormType) => void;
    onTitleChange?: (title: string) => void;
    onDescriptionChange?: (description: string) => void;
    onOwnerChange: (activity: Activity) => void;
    onProjectChange: (project: Project) => void;
    onStateChange: (state: State) => void;
    onPriorityChange: (priority: Priority) => void;
    onEstimateChange: (estimate?: EstimateInput) => void;
    onTagAdd: (tag: TagModel) => void;
    onTagDelete: (tag: TagModel) => void;
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
    tags = new Map<string, TagModel>(),
    state,
    priority,
    estimate,
    i18nKeyset,
    locale,
    children,
    onSumbit,
    onTitleChange,
    onDescriptionChange,
    onOwnerChange,
    onProjectChange,
    onStateChange,
    onPriorityChange,
    onEstimateChange,
    onTagAdd,
    onTagDelete,
}) => {
    const t = useTranslations(i18nKeyset);
    const schema = schemaProvider(t);

    const {
        control,
        register,
        handleSubmit,
        watch,
        setFocus,
        formState: { errors, isValid, isSubmitted },
    } = useForm<GoalFormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: {
            title,
            description,
        },
    });

    useEffect(() => {
        setTimeout(() => setFocus('title'), 0);
    }, [setFocus]);

    const titleWatcher = watch('title');
    useEffect(() => {
        onTitleChange && onTitleChange(titleWatcher);
    }, [titleWatcher, onTitleChange]);

    const descriptionWatcher = watch('description');
    useEffect(() => {
        onDescriptionChange && onDescriptionChange(descriptionWatcher);
    }, [descriptionWatcher, onDescriptionChange]);

    const onTagDeleteProvider = useCallback(
        (tag: TagModel) => () => {
            onTagDelete(tag);
        },
        [onTagDelete],
    );

    const onFormSubmit = useCallback(
        (fields: GoalFormType) => {
            onSumbit(fields);
        },
        [onSumbit],
    );

    const ownerButtonText = owner?.user?.name || owner?.user?.email || owner?.ghost?.email || t('Assign');
    const projectButtonText = project?.title || t('Enter project title');
    const stateButtonText = state?.title || t('State');
    const priorityButtonText = priority || t('Priority.Priority');

    return (
        <>
            <h2>{formTitle}</h2>

            <Form onSubmit={handleSubmit(onFormSubmit)}>
                <FormInput
                    {...register('title')}
                    error={isSubmitted ? errors.title : undefined}
                    placeholder={t("Goal's title")}
                    autoFocus
                    flat="bottom"
                />

                {/* https://github.com/taskany-inc/issues/issues/234 t('And its description') */}
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => <FormEditor flat="both" {...field} />}
                />

                <StyledTagsContainer>
                    {Array.from(tags.values()).map((tag) => (
                        <Tag
                            key={tag.id}
                            title={tag.title}
                            description={tag.description}
                            onHide={onTagDeleteProvider(tag)}
                        />
                    ))}
                </StyledTagsContainer>

                <FormActions flat="top">
                    <FormAction left inline>
                        <UserCompletionDropdown
                            size="m"
                            text={ownerButtonText}
                            placeholder={t('Enter name or email')}
                            query={owner?.user?.name || owner?.user?.email || owner?.ghost?.email}
                            userPic={
                                <UserPic
                                    src={owner?.user?.image}
                                    email={owner?.user?.email || owner?.ghost?.email}
                                    size={16}
                                />
                            }
                            onClick={onOwnerChange}
                        />

                        <ProjectCompletion
                            text={projectButtonText}
                            placeholder={t('Enter project title')}
                            query={project?.title}
                            onClick={onProjectChange}
                        />

                        <StateDropdown
                            size="m"
                            text={stateButtonText}
                            flowId={project?.flow?.id}
                            state={state}
                            onClick={onStateChange}
                        />

                        <PriorityDropdown
                            size="m"
                            text={priorityButtonText}
                            priority={priority}
                            onClick={onPriorityChange}
                        />

                        <EstimateDropdown
                            locale={locale}
                            size="m"
                            text={t('Schedule')}
                            placeholder={t('Date input mask placeholder')}
                            mask={t('Date input mask')}
                            value={estimate}
                            defaultValuePlaceholder={estimate ?? estimatedMeta({ locale })}
                            onChange={onEstimateChange}
                        />

                        {Array.from(tags.values()).length < tagsLimit ? (
                            <TagCompletion
                                text="Tags"
                                filter={Array.from(tags.keys())}
                                placeholder={t('Enter tag title')}
                                onAdd={onTagAdd}
                            />
                        ) : null}
                    </FormAction>
                    <FormAction right inline>
                        <Button
                            size="m"
                            view="primary"
                            type="submit"
                            disabled={!(isValid && project)}
                            text={t('Submit')}
                        />
                    </FormAction>
                </FormActions>
            </Form>

            {children}
        </>
    );
};
