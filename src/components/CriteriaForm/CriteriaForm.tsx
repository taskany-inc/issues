import { zodResolver } from '@hookform/resolvers/zod';
import {
    AutoCompleteRadioGroup,
    nullable,
    Form,
    Text,
    Button,
    FormControl,
    FormControlLabel,
    FormControlInput,
    FormControlError,
} from '@taskany/bricks';
import { gapSm, gray7 } from '@taskany/colors';
import { ComponentProps, forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components';
import { z } from 'zod';

import { GoalSelect } from '../GoalSelect';
import { GoalBadge } from '../GoalBadge';
import { FilterAutoCompleteInput } from '../FilterAutoCompleteInput/FilterAutoCompleteInput';
import { AddInlineTrigger } from '../AddInlineTrigger';
import { StateDot } from '../StateDot';

import { tr } from './CriteriaForm.i18n';

const StyledGoalBadge = styled(GoalBadge)`
    padding: 0;
`;

interface SuggestItem {
    id: string;
    title: string;
    stateColor?: number;
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
    onItemChange?: (item?: SuggestItem) => void;
    onInputChange?: (value?: string) => void;
    validateBindingsFor: (selectedId: string) => Promise<null>;
}

interface WeightFieldProps extends Pick<ComponentProps<typeof FormControlInput>, 'name' | 'value' | 'onChange'> {
    error?: ComponentProps<typeof FormControlError>['error'];
    maxValue: number;
}

const StyledFormRow = styled.div`
    display: flex;
    flex-wrap: nowrap;
    margin-top: ${gapSm};
`;

const StyledButton = styled(Button)`
    margin-left: auto;
`;

const StyledFormControlInput = styled(FormControlInput)`
    width: 3ch;
`;

const CriteriaWeightField = forwardRef<HTMLInputElement, WeightFieldProps>(
    ({ error, maxValue, value, onChange, name }, ref) => {
        return (
            <FormControl error={error?.message != null} variant="outline" inline>
                <FormControlLabel color={gray7}>{tr('Weight')}</FormControlLabel>
                <StyledFormControlInput
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    autoFocus
                    autoComplete="off"
                    name={name}
                    disabled={maxPossibleWeight === maxValue}
                >
                    {nullable(error, (err) => (
                        <FormControlError error={err} />
                    ))}
                </StyledFormControlInput>
                <Text size="s" color={gray7}>
                    {tr.raw('Weight out of', {
                        upTo: maxPossibleWeight - maxValue,
                    })}
                </Text>
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
    isEditMode?: boolean;
}

const CriteriaTitleField: React.FC<CriteriaTitleFieldProps> = ({
    mode,
    selectedItem,
    onChange,
    value,
    name,
    errors = {},
    isEditMode,
}) => {
    const { selected, title } = errors;

    const icon = useMemo(() => {
        if (mode === 'simple') return false;
        if (!selectedItem || !selectedItem?.stateColor) return;

        const color = selectedItem.stateColor || 1;

        return <StateDot size="s" hue={color} view="stroke" />;
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
            disabled={isEditMode}
            placeholder={mode === 'simple' ? tr('Criteria title') : undefined}
        />
    );
};

export const CriteriaForm = ({
    onInputChange,
    onItemChange,
    onSubmit,
    items,
    withModeSwitch,
    validityData,
    validateBindingsFor,
    values,
    value,
    mode,
    setMode,
}: CriteriaFormProps) => {
    const [showWeightInput, setShowWeightInput] = useState(Boolean(values?.title));

    const { control, watch, setValue, register, resetField, handleSubmit, setError, trigger } =
        useForm<CriteriaFormValues>({
            resolver: zodResolver(patchZodSchema(validityData, validateBindingsFor, values)),
            defaultValues: {
                mode,
                title: '',
                weight: '',
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

    useEffect(() => {
        const sub = watch((currentValues, { name, type }) => {
            if (type === 'change') {
                if (name === 'title') {
                    onInputChange?.(currentValues.title);

                    if (
                        'selected' in currentValues &&
                        currentValues.selected != null &&
                        currentValues.selected.id != null
                    ) {
                        resetField('selected');
                        resetField('weight', { defaultValue: '' });
                    }
                }

                return;
            }

            if (
                currentValues.mode === 'goal' &&
                (name === 'selected' || name === 'selected.id' || name === 'selected.title')
            ) {
                onItemChange?.(currentValues.selected as Required<SuggestItem>);

                trigger('selected');
            }

            if (name === 'mode') {
                if (currentValues.title) {
                    trigger('title');
                }
            }
        });

        return () => sub.unsubscribe();
    }, [watch, onInputChange, onItemChange, resetField, setError, trigger]);

    const handleSelectItem = useCallback(
        (item: SuggestItem) => {
            setValue('selected', item);
            setValue('title', item.title);
        },
        [setValue],
    );

    const handleChangeMode = useCallback(
        (mode: CriteriaFormMode) => {
            setValue('mode', mode);
            setMode(mode);
        },
        [setMode, setValue],
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

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <GoalSelect
                items={items}
                value={value}
                onClick={handleSelectItem}
                renderItem={(props) => <StyledGoalBadge title={props.item.title} color={props.item.stateColor} />}
            >
                <>
                    <Controller
                        name="title"
                        control={control}
                        render={({ field, formState }) => (
                            <CriteriaTitleField
                                mode={mode}
                                isEditMode={isEditMode}
                                selectedItem={selected}
                                {...field}
                                errors={formState.errors}
                            />
                        )}
                    />

                    {nullable(withModeSwitch, () => (
                        <Controller
                            name="mode"
                            control={control}
                            render={({ field }) => (
                                <AutoCompleteRadioGroup
                                    title={tr('Mode')}
                                    items={radios}
                                    {...field}
                                    onChange={(val) => handleChangeMode(val.value)}
                                />
                            )}
                        />
                    ))}

                    <StyledFormRow>
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

                        <StyledButton type="submit" text={isEditMode ? tr('Save') : tr('Add')} view="primary" outline />
                    </StyledFormRow>
                </>
            </GoalSelect>

            <input type="hidden" {...register('id')} />
            <input type="hidden" {...register('selected.id')} />
            <input type="hidden" {...register('selected.title')} />
        </Form>
    );
};
