import { zodResolver } from '@hookform/resolvers/zod';
import { nullable, Form } from '@taskany/bricks';
import { ComponentProps, forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
    Button,
    FormControl,
    FormControlLabel,
    FormControlInput,
    FormControlError,
    Switch,
    SwitchControl,
} from '@taskany/bricks/harmony';

import { GoalSelect } from '../GoalSelect';
import { GoalBadge } from '../GoalBadge';
import { FilterAutoCompleteInput } from '../FilterAutoCompleteInput/FilterAutoCompleteInput';
import { AddInlineTrigger } from '../AddInlineTrigger/AddInlineTrigger';
import { StateDot } from '../StateDot/StateDot';

import { tr } from './CriteriaForm.i18n';
import s from './CriteriaForm.module.css';

interface SuggestItem {
    id: string;
    title: string;
    state?: ComponentProps<typeof StateDot>['state'] | null;
    _shortId: string;
}

interface ValidityData {
    title: string[];
    sumOfCriteria: number;
}

type CriteriaFormMode = 'simple' | 'goal';

export const maxPossibleWeight = 100;
export const minPossibleWeight = 1;

interface FormValues {
    mode: CriteriaFormMode;
    title: string;
    weight?: string;
    selected?: SuggestItem;
}

function patchZodSchema<T extends FormValues>(
    data: ValidityData,
    checkBindingsBetweenGoals: CriteriaFormProps['validateBindingsFor'],
    defaultValues?: T,
) {
    return z
        .discriminatedUnion('mode', [
            z.object({
                mode: z.literal('simple'),
                id: z.string().optional(),
                selected: z.object({}).optional(),
            }),
            z.object({
                mode: z.literal('goal'),
                id: z.string(),
                selected: z.object({
                    id: z.string().refine(
                        async (val) => {
                            if (defaultValues?.selected?.id === val) {
                                return true;
                            }

                            try {
                                await checkBindingsBetweenGoals(val);
                                return true;
                            } catch (_error) {
                                return false;
                            }
                        },
                        { message: tr('This binding is already exist'), path: [] },
                    ),
                    title: z
                        .string()
                        .refine((val) => !data.title.includes(val), { message: tr('Title must be unique') }),
                    stateColor: z.number().optional(),
                }),
            }),
        ])
        .and(
            z.object({
                title: z
                    .string({ required_error: tr('Title is required') })
                    .min(1, tr('Title must be longer than 1 symbol'))
                    .refine((val) => !data.title.includes(val), tr('Title must be unique')),
                weight: z.string().superRefine((val, ctx): val is string => {
                    /* INFO: https://github.com/colinhacks/zod#abort-early */
                    if (!val || !val.length) {
                        return z.NEVER;
                    }

                    const parsed = Number(val);

                    if (Number.isNaN(parsed)) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: tr('Weight must be an integer'),
                        });
                    }

                    if (parsed < minPossibleWeight || data.sumOfCriteria + parsed > maxPossibleWeight) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: tr
                                .raw('Passed weight is not in range', {
                                    upTo: maxPossibleWeight - data.sumOfCriteria,
                                })
                                .join(''),
                        });
                    }

                    return z.NEVER;
                }),
            }),
        );
}

type CriteriaFormValues = FormValues & z.infer<ReturnType<typeof patchZodSchema>>;

interface CriteriaFormProps {
    items: SuggestItem[];
    value?: SuggestItem[];
    mode: CriteriaFormMode;
    withModeSwitch?: boolean;
    values?: CriteriaFormValues;
    validityData: { title: string[]; sumOfCriteria: number };

    setMode: (mode: CriteriaFormMode) => void;
    onSubmit: (values: CriteriaFormValues) => void;
    onReset: () => void;
    onItemChange?: (item?: SuggestItem) => void;
    onInputChange?: (value?: string) => void;
    validateBindingsFor: (selectedId: string) => Promise<null>;
}

interface WeightFieldProps extends Pick<ComponentProps<typeof FormControlInput>, 'name' | 'value' | 'onChange'> {
    error?: ComponentProps<typeof FormControlError>['error'];
    maxValue: number;
}

const CriteriaWeightField = forwardRef<HTMLInputElement, WeightFieldProps>(
    ({ error, maxValue, value, onChange, name }, ref) => {
        return (
            <FormControl className={s.FormControl}>
                <FormControlLabel size="s" className={s.FormControlLabel}>
                    {tr('Weight')}
                </FormControlLabel>
                <FormControlInput
                    className={s.FormControlWeigthInput}
                    outline
                    size="s"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    autoFocus
                    autoComplete="off"
                    name={name}
                    disabled={maxPossibleWeight === maxValue}
                    maxLength={3}
                    placeholder={tr.raw('ex: NN%', { val: maxPossibleWeight - maxValue }).join('')}
                />
                {nullable(error, (err) => (
                    <FormControlError error={err} />
                ))}
            </FormControl>
        );
    },
);
interface ErrorMessage {
    message?: string;
}

interface CriteriaTitleFieldProps
    extends Pick<ComponentProps<typeof FilterAutoCompleteInput>, 'name' | 'value' | 'onChange'> {
    errors?: {
        title?: ErrorMessage;
        selected?: {
            id?: ErrorMessage;
            title?: ErrorMessage;
        };
    };
    mode: CriteriaFormMode;
    selectedItem?: SuggestItem | null;
}

const CriteriaTitleField: React.FC<CriteriaTitleFieldProps> = ({
    mode,
    selectedItem,
    onChange,
    value,
    name,
    errors = {},
}) => {
    const { selected, title } = errors;

    const icon = useMemo(() => {
        if (mode === 'simple') return false;
        if (!selectedItem || !selectedItem?.state) return;

        return <StateDot size="s" state={selectedItem.state} view="stroke" />;
    }, [mode, selectedItem]);

    const error = useMemo(() => {
        if (mode === 'goal' && selected) {
            if (selected.id) {
                return selected.id;
            }

            if (selected.title) {
                return selected.title;
            }
        }

        if (mode === 'simple' && title) {
            return title;
        }

        return undefined;
    }, [mode, selected, title]);

    return (
        <FilterAutoCompleteInput
            name={name}
            icon={icon}
            value={value}
            error={error}
            onChange={onChange}
            placeholder={mode === 'simple' ? tr('Criteria title') : undefined}
            autoFocus
        />
    );
};

export const CriteriaForm = ({
    onInputChange,
    onItemChange,
    onSubmit,
    onReset,
    items,
    withModeSwitch,
    validityData,
    validateBindingsFor,
    values,
    value,
    mode: defaultMode,
    setMode,
}: CriteriaFormProps) => {
    const [showWeightInput, setShowWeightInput] = useState(Boolean(values?.title));

    const { control, watch, setValue, register, resetField, handleSubmit, setError, trigger, reset } =
        useForm<CriteriaFormValues>({
            resolver: zodResolver(patchZodSchema(validityData, validateBindingsFor, values)),
            defaultValues: {
                mode: defaultMode,
                title: '',
                weight: '',
                selected: undefined,
            },
            values,
            mode: 'onChange',
            reValidateMode: 'onChange',
        });

    const isEditMode = values != null && !!values.title?.length;

    const radios: Array<{ value: CriteriaFormMode; title: string }> = [
        { title: tr('Simple'), value: 'simple' },
        { title: tr('Goal'), value: 'goal' },
    ];

    const title = watch('title');
    const selected = watch('selected');
    const mode = watch('mode');

    useEffect(() => {
        const subTitle = watch(
            ({ title, selected = undefined }, { name, type }) => {
                if (type === 'change') {
                    if (name === 'title') {
                        onInputChange?.(title);

                        if (selected != null && selected.id != null) {
                            setValue('selected', undefined);
                            setValue('weight', '');
                        }
                    }
                }
            },
            { selected: undefined },
        );
        const subSelected = watch(({ selected, mode }, { name }) => {
            if (mode === 'goal' && (name === 'selected' || name === 'selected.id' || name === 'selected.title')) {
                onItemChange?.(selected as Required<SuggestItem>);

                trigger('selected');
            }
        });

        const subMode = watch(({ title, mode }, { name }) => {
            if (name === 'mode') {
                if (title) {
                    trigger('title');
                }

                if (mode) {
                    setMode(mode);
                }
            }
        });

        return () => {
            [subMode, subSelected, subTitle].forEach((sub) => sub.unsubscribe());
        };
    }, [watch, onInputChange, onItemChange, resetField, setError, trigger, setValue, setMode]);

    const handleSelectItem = useCallback(
        (item: SuggestItem) => {
            setValue('selected', item);
            setValue('title', item.title);
        },
        [setValue],
    );

    const handleChangeMode = useCallback(
        (_: React.SyntheticEvent<HTMLButtonElement>, active: string) => {
            setValue('mode', active as CriteriaFormMode);
        },
        [setValue],
    );

    const needShowWeightField = useMemo(() => {
        if (mode === 'simple') {
            return !!title;
        }

        if (mode === 'goal') {
            return !!(title && selected?.id);
        }

        return false;
    }, [mode, title, selected?.id]);

    const resetHandler = useCallback(() => {
        if (!isEditMode) {
            setShowWeightInput(false);
        }

        reset(values);
        onReset();
    }, [reset, onReset, isEditMode, values]);

    const onFormSubmit = useCallback<typeof onSubmit>(
        (formData) => {
            onSubmit(formData);
            resetHandler();
        },
        [onSubmit, resetHandler],
    );

    return (
        <Form onSubmit={handleSubmit(onFormSubmit)} onReset={resetHandler}>
            <GoalSelect
                mode="single"
                viewMode="union"
                items={items}
                value={value}
                onClick={handleSelectItem}
                renderItem={(props) => (
                    <GoalBadge title={props.item.title} state={props.item.state ?? undefined} className={s.GoalBadge} />
                )}
            >
                <>
                    {nullable(withModeSwitch, () => (
                        <Controller
                            name="mode"
                            control={control}
                            render={({ field }) => (
                                <Switch className={s.FullWidthSwitch} onChange={handleChangeMode} value={field.value}>
                                    {radios.map((radio) => (
                                        <SwitchControl
                                            className={s.HalfWidthSwitchControl}
                                            key={radio.value}
                                            text={radio.title}
                                            value={radio.value}
                                        />
                                    ))}
                                </Switch>
                            )}
                        />
                    ))}

                    <Controller
                        name="title"
                        control={control}
                        render={({ field, formState }) => (
                            <CriteriaTitleField
                                mode={mode}
                                selectedItem={selected}
                                {...field}
                                errors={formState.errors}
                            />
                        )}
                    />

                    <div className={s.FormRow}>
                        {nullable(needShowWeightField, () => (
                            <Controller
                                name="weight"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        {nullable(
                                            showWeightInput,
                                            () => (
                                                <CriteriaWeightField
                                                    {...field}
                                                    maxValue={validityData.sumOfCriteria}
                                                    error={fieldState.error}
                                                />
                                            ),
                                            <AddInlineTrigger
                                                onClick={() => setShowWeightInput(true)}
                                                text={tr('Add weight')}
                                                centered={false}
                                            />,
                                        )}
                                    </>
                                )}
                            />
                        ))}

                        <div className={s.FormControlButtons}>
                            <Button type="reset" text={tr('Reset')} view="default" />
                            <Button type="submit" text={isEditMode ? tr('Save') : tr('Add')} view="primary" />
                        </div>
                    </div>
                </>
            </GoalSelect>

            <input type="hidden" {...register('id')} />
            <input type="hidden" {...register('selected.id')} />
            <input type="hidden" {...register('selected._shortId')} />
            <input type="hidden" {...register('selected.title')} />
        </Form>
    );
};
