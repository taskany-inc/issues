import { useCallback, useEffect } from 'react';
import { useForm, Controller, WatchObserver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Schema, z } from 'zod';
import { State, Tag as TagModel } from '@prisma/client';
import { DateRangeType, nullable } from '@taskany/bricks';
import {
    FormControl,
    FormControlInput,
    FormControlError,
    Tag,
    TagCleanButton,
    ModalContent,
    Switch,
    SwitchControl,
} from '@taskany/bricks/harmony';

import { FormControlEditor } from '../FormControlEditor/FormControlEditor';
import { errorsProvider } from '../../utils/forms';
import { TagComboBox } from '../TagComboBox/TagComboBox';
import { StateDropdown } from '../StateDropdown/StateDropdown';
import { PriorityDropdown } from '../PriorityDropdown/PriorityDropdown';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { HelpButton } from '../HelpButton/HelpButton';
import {
    combobox,
    estimateCombobox,
    goalDescriptionInput,
    goalPersonalityToggle,
    goalPersonalityToggleProjectValue,
    goalPersonalityTogglePersonalValue,
    goalTagList,
    goalTagListItem,
    goalTagListItemClean,
    goalTitleInput,
    goalTitleInputError,
    priorityCombobox,
    projectsCombobox,
    stateCombobox,
    usersCombobox,
} from '../../utils/domObjects';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { TagsList } from '../TagsList/TagsList';
import { GoalParentDropdown } from '../GoalParentDropdown/GoalParentDropdown';
import { UserDropdown } from '../UserDropdown/UserDropdown';
import { EstimateDropdown } from '../EstimateDropdown/EstimateDropdown';
import { FormActions } from '../FormActions/FormActions';

import { tr } from './GoalForm.i18n';
import s from './GoalForm.module.css';

const goalTypeMap = {
    personal: 'personal',
    default: 'default',
} as const;

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
        type: DateRangeType;
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
    const {
        control,
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitted },
        resetField,
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
            mode: personal ? goalTypeMap.personal : goalTypeMap.default,
        },
        defaultValues: {
            title: '',
            description: '',
            owner: null,
            parent: null,
            state: null,
            priority: null,
            estimate: null,
            tags: [],
            id: null,
            mode: goalTypeMap.default,
        },
    });

    const parentWatcher = watch('parent');
    const mode = watch('mode');
    const tagsWatcher: TagModel[] = watch('tags');
    const errorsResolver = errorsProvider(errors, isSubmitted);

    const watchModeObserver = useCallback<WatchObserver<z.infer<typeof validitySchema>>>(
        ({ mode }, { name }) => {
            if (name === 'mode') {
                if (mode === goalTypeMap.personal) {
                    setValue('parent', null);
                } else {
                    setValue('parent', parent);
                }
                resetField('state');
                resetField('parent');
            }
        },
        [setValue, parent, resetField],
    );

    useEffect(() => {
        const parentSubWatch = watch(watchModeObserver);

        return () => {
            parentSubWatch.unsubscribe();
        };
    }, [watch, watchModeObserver]);

    const onTagDeleteProvider = useCallback(
        (tag: Partial<TagModel>) => () => {
            const tags = tagsWatcher?.filter((t) => t.id !== tag.id);
            setValue('tags', tags);
        },
        [setValue, tagsWatcher],
    );

    const onNewProjectClick = useCallback(() => {
        dispatchModalEvent(ModalEvent.GoalCreateModal)();
    }, []);

    return (
        <ModalContent {...attrs}>
            <form onSubmit={handleSubmit(onSubmit)} className={s.Form}>
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
                                    brick="top"
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

                {nullable(tip || !id, () => (
                    <FormActions align="left">
                        {nullable(!id, () => (
                            <Controller
                                name="mode"
                                control={control}
                                render={({ field }) => (
                                    <div className={s.SwitchGoalType}>
                                        <Switch
                                            {...field}
                                            onChange={(_, value) => setValue('mode', value)}
                                            {...goalPersonalityToggle.attr}
                                        >
                                            <SwitchControl
                                                text={tr('Project goal')}
                                                value={goalTypeMap.default}
                                                {...goalPersonalityToggleProjectValue.attr}
                                            />
                                            <SwitchControl
                                                text={tr('Personal goal')}
                                                value={goalTypeMap.personal}
                                                {...goalPersonalityTogglePersonalValue.attr}
                                            />
                                        </Switch>
                                        <HelpButton slug="goals" />
                                    </div>
                                )}
                            />
                        ))}
                        {nullable(tip, () => (
                            <div className={s.FormTip}>{tip}</div>
                        ))}
                    </FormActions>
                ))}

                <FormActions className={s.FormActions} {...combobox.attr}>
                    {nullable(!id && mode === goalTypeMap.default, () => (
                        <Controller
                            name="parent"
                            control={control}
                            render={({ field }) => (
                                <GoalParentDropdown
                                    mode="single"
                                    label="Project"
                                    placeholder={tr('Enter project')}
                                    error={errorsResolver(field.name)}
                                    disabled={busy}
                                    className={s.GoalFormParentDropdown}
                                    onNewProjectClick={onNewProjectClick}
                                    {...field}
                                    {...projectsCombobox.attr}
                                />
                            )}
                        />
                    ))}

                    <Controller
                        name="owner"
                        control={control}
                        render={({ field }) => (
                            <UserDropdown
                                mode="single"
                                label="Owner"
                                placeholder={tr('Enter name or email')}
                                error={errorsResolver(field.name)}
                                disabled={busy}
                                className={s.GoalFormUserDropdown}
                                {...usersCombobox.attr}
                                {...field}
                            />
                        )}
                    />

                    <Controller
                        name="priority"
                        control={control}
                        render={({ field }) => (
                            <PriorityDropdown
                                mode="single"
                                label="Priority"
                                error={errorsResolver(field.name)}
                                disabled={busy}
                                className={s.GoalFormPriorityDropdown}
                                {...priorityCombobox.attr}
                                {...field}
                            />
                        )}
                    />

                    <Controller
                        name="state"
                        control={control}
                        render={({ field }) => (
                            <StateDropdown
                                mode="single"
                                label="State"
                                setDefault
                                flowId={parentWatcher?.flowId}
                                error={errorsResolver(field.name)}
                                disabled={(mode === goalTypeMap.default && !parentWatcher?.flowId) || busy}
                                className={s.GoalFormStateDropdown}
                                {...stateCombobox.attr}
                                {...field}
                            />
                        )}
                    />

                    <Controller
                        name="estimate"
                        control={control}
                        render={({ field }) => {
                            return (
                                <EstimateDropdown
                                    label="Estimate"
                                    placement="top-end"
                                    error={errorsResolver(field.name)}
                                    className={s.GoalFormEstimateDropdown}
                                    {...field}
                                    {...estimateCombobox.attr}
                                />
                            );
                        }}
                    />
                </FormActions>

                <FormActions className={s.FormActions}>
                    <TagsList {...goalTagList.attr}>
                        {tagsWatcher.map((tag) => (
                            <Tag
                                key={tag.id}
                                {...goalTagListItem.attr}
                                action={
                                    <TagCleanButton onClick={onTagDeleteProvider(tag)} {...goalTagListItemClean.attr} />
                                }
                            >
                                {tag.title}
                            </Tag>
                        ))}
                        <Controller
                            name="tags"
                            control={control}
                            render={({ field }) => (
                                <TagComboBox
                                    placeholder={tr('Enter tag title')}
                                    disabled={busy || (tagsWatcher || []).length >= tagsLimit}
                                    {...combobox.attr}
                                    {...field}
                                />
                            )}
                        />
                    </TagsList>

                    {actionButton}
                </FormActions>
            </form>
        </ModalContent>
    );
};
