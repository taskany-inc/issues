import { useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Schema, z } from 'zod';
import { State, Tag as TagModel } from '@prisma/client';
import { Form, FormAction, ModalContent, Tag, TagCleanButton, nullable } from '@taskany/bricks';
import { IconCalendarTickOutline } from '@taskany/icons';
import { Button, FormControl, FormControlInput, FormControlError } from '@taskany/bricks/harmony';

import { FormControlEditor } from '../FormControlEditor/FormControlEditor';
import { errorsProvider } from '../../utils/forms';
import { formateEstimate } from '../../utils/dateTime';
import { DateType } from '../../types/date';
import { useLocale } from '../../hooks/useLocale';
import { UserComboBox } from '../UserComboBox';
import { GoalParentComboBox } from '../GoalParentComboBox';
import { TagComboBox } from '../TagComboBox';
import { StateDropdown } from '../StateDropdown';
import { PriorityDropdown } from '../PriorityDropdown';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { HelpButton } from '../HelpButton/HelpButton';
import {
    combobox,
    estimateCombobox,
    goalDescriptionInput,
    goalTagList,
    goalTagListItem,
    goalTagListItemClean,
    goalTitleInput,
    goalTitleInputError,
} from '../../utils/domObjects';
import { TagsList } from '../TagsList';
import { FormActions } from '../FormActions/FormActions';

import { GoalFormEstimate } from './GoalFormEstimate';
import { tr } from './GoalForm.i18n';
import s from './GoalForm.module.css';

const tagsLimit = 5;
interface GoalFormProps extends React.HTMLAttributes<HTMLDivElement> {
    actionButton: React.ReactNode;
    owner?: ActivityByIdReturnType;
    title?: string;
    description?: string;
    parent?: { id: string; title: string; flowId: string; description?: string | null };
    personal?: boolean;
    tags?: TagModel[];
    state?: State;
    priority?: {
        id: string;
        title: string;
        value: number;
        default: boolean;
    };
    estimate?: {
        date: string;
        type: DateType;
    };
    busy?: boolean;
    validitySchema: Schema;
    id?: string;
    tip?: React.ReactNode;

    onSubmit: (fields: z.infer<GoalFormProps['validitySchema']>) => void;
}

export const GoalForm: React.FC<GoalFormProps> = ({
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
    validitySchema,
    actionButton,
    tip,
    onSubmit,
    personal,
    ...attrs
}) => {
    const locale = useLocale();
    const {
        control,
        register,
        handleSubmit,
        watch,
        setFocus,
        setValue,
        formState: { errors, isSubmitted },
    } = useForm<z.infer<typeof validitySchema>>({
        resolver: zodResolver(validitySchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: false,
        values: {
            title,
            description,
            owner,
            parent: personal ? null : parent,
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
        <ModalContent {...attrs}>
            <Form onSubmit={handleSubmit(onSubmit)} className={s.Form}>
                <div>
                    <FormControl>
                        <FormControlInput
                            {...register('title')}
                            disabled={busy}
                            autoFocus
                            placeholder={tr("Goal's title")}
                            brick="bottom"
                            size="m"
                            {...goalTitleInput.attr}
                        />
                        {nullable(errorsResolver('title'), (error) => (
                            <FormControlError error={error} {...goalTitleInputError.attr} />
                        ))}
                    </FormControl>

                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <FormControl>
                                <FormControlEditor
                                    placeholder={tr('And its description')}
                                    disabled={busy}
                                    brick="center"
                                    height={200}
                                    {...field}
                                    {...goalDescriptionInput.attr}
                                />
                                {nullable(errorsResolver(field.name), (error) => (
                                    <FormControlError error={error} />
                                ))}
                            </FormControl>
                        )}
                    />
                </div>

                <FormActions>
                    <FormAction left inline>
                        {nullable(!id && !personal, () => (
                            <Controller
                                name="parent"
                                control={control}
                                render={({ field }) => (
                                    <GoalParentComboBox
                                        text={tr('Enter project')}
                                        placeholder={tr('Enter project')}
                                        error={errorsResolver(field.name)}
                                        disabled={busy}
                                        {...field}
                                    />
                                )}
                            />
                        ))}

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
                            render={({ field }) => {
                                return (
                                    <GoalFormEstimate
                                        placement="top"
                                        renderTrigger={(props) => (
                                            <Button
                                                onClick={props.onClick}
                                                disabled={busy}
                                                text={
                                                    field.value
                                                        ? formateEstimate(new Date(field.value.date), {
                                                              locale,
                                                              type: field.value.type,
                                                          })
                                                        : ''
                                                }
                                                iconLeft={<IconCalendarTickOutline size="xs" />}
                                                {...estimateCombobox.attr}
                                            />
                                        )}
                                        error={errorsResolver(field.name)}
                                        {...field}
                                    />
                                );
                            }}
                        />

                        <Controller
                            name="state"
                            control={control}
                            render={({ field }) => (
                                <StateDropdown
                                    text={tr('State')}
                                    flowId={parentWatcher?.flowId}
                                    error={errorsResolver(field.name)}
                                    disabled={(!personal && !parentWatcher?.flowId) || busy}
                                    {...combobox.attr}
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
                                    {...combobox.attr}
                                    {...field}
                                />
                            )}
                        />

                        <HelpButton slug="goals" />
                    </FormAction>
                </FormActions>

                <FormActions>
                    <FormAction left>
                        {nullable(
                            tagsWatcher,
                            (tags) => (
                                <TagsList {...goalTagList.attr}>
                                    {tags.map((tag) => (
                                        <Tag key={tag.id} {...goalTagListItem.attr}>
                                            <TagCleanButton
                                                onClick={onTagDeleteProvider(tag)}
                                                {...goalTagListItemClean.attr}
                                            />
                                            {tag.title}
                                        </Tag>
                                    ))}
                                </TagsList>
                            ),
                            tip,
                        )}
                    </FormAction>
                    <FormAction right inline>
                        {actionButton}
                    </FormAction>
                </FormActions>
            </Form>
        </ModalContent>
    );
};
