import { zodResolver } from '@hookform/resolvers/zod';
import {
    AutoComplete,
    AutoCompleteRadioGroup,
    AutoCompleteList,
    nullable,
    Form,
    useKeyboard,
    KeyCode,
    Text,
    Button,
    FormControl,
    FormControlLabel,
    FormControlInput,
    FormControlError,
} from '@taskany/bricks';
import { gapS, gapSm, gray7 } from '@taskany/colors';
import { IconPlusCircleOutline, IconSearchOutline, IconTargetOutline } from '@taskany/icons';
import { ReactEventHandler, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import colorLayer from 'color-layer';
import styled from 'styled-components';
import { z } from 'zod';

import { InlineTrigger } from '../InlineTrigger';
import { useForkedRef } from '../../hooks/useForkedRef';
import { usePageContext } from '../../hooks/usePageContext';

import { tr } from './CriteriaForm.i18n';

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
    checkBindingsBetweenGoals: (selectedGoalId: string) => Promise<void>,
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
                id: z.string().optional(),
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
                    title: z.string().refine(
                        (val) => {
                            return !data.title.includes(val);
                        },
                        { message: tr('Title must be unique') },
                    ),
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
    defaultMode?: CriteriaFormMode;
    withModeSwitch?: boolean;
    values?: CriteriaFormValues;
    validityData: { title: string[]; sumOfCriteria: number };

    onModeChange?: (mode: CriteriaFormMode) => void;
    onSubmit: (values: CriteriaFormValues) => void;
    onCancel?: () => void;
    onItemChange?: (item?: SuggestItem) => void;
    onInputChange?: (value?: string) => void;
    validateBindingsFor: (selectedId: string) => Promise<void>;

    renderItem: React.ComponentProps<typeof AutoComplete<SuggestItem>>['renderItem'];
}

const keyGetter = (item: SuggestItem) => item.id;

interface WeightFieldProps {
    name: 'weight';
    value?: string;
    onChange: ReactEventHandler<HTMLInputElement>;
    error?: { message?: string };
    maxValue: number;
    visible?: boolean;
}

const StyledWeightFieldWrapper = styled.div`
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: ${gapS};
    height: 28px; // input height
`;

const StyledText = styled(Text)`
    white-space: nowrap;
`;

const StyledFormRow = styled.div`
    display: flex;
    flex-wrap: nowrap;
    margin-top: ${gapSm};
    margin-left: calc(${gapS} + 1px); // 'cause input have 1px border
`;

const StyledFormControlsWrapper = styled.div`
    display: inline-flex;
    margin-left: auto;
    white-space: nowrap;
    gap: ${gapS};
`;

const StyledFormControl = styled(FormControl)`
    display: flex;
    flex-wrap: nowrap;
    max-width: 100px;
    width: 100%;
`;

const StyledFormControlInput = styled(FormControlInput)`
    width: 3ch;
`;

const StyledAutoCompleteRadiosWrapper = styled.div`
    margin-left: calc(${gapS} + 1px); // 'cause input have 1px border
`;

const CriteriaWeightField = forwardRef<HTMLInputElement, WeightFieldProps>(
    ({ error, maxValue, value, onChange, name, visible = false }, ref) => {
        const [showWeigthInput, setShowWeigthInput] = useState(visible);
        const innerInputRef = useRef<HTMLInputElement>(null);
        const inputRef = useForkedRef(ref, innerInputRef);

        const [onESC] = useKeyboard([KeyCode.Escape], () => {
            if (document.activeElement === innerInputRef.current) {
                setShowWeigthInput(false);
            }
        });

        return (
            <StyledWeightFieldWrapper>
                {nullable(
                    showWeigthInput,
                    () => (
                        <StyledFormControl error={error?.message != null} variant="outline" inline>
                            <FormControlLabel color={gray7}>{tr('Weight')}</FormControlLabel>
                            <StyledFormControlInput
                                value={value}
                                onChange={onChange}
                                ref={inputRef}
                                {...onESC}
                                autoFocus={!value}
                                autoComplete="off"
                                name={name}
                                disabled={maxPossibleWeight === maxValue}
                            >
                                {nullable(error?.message, (message) => (
                                    <FormControlError>{message}</FormControlError>
                                ))}
                            </StyledFormControlInput>
                            <StyledText size="s" color={gray7}>
                                {tr.raw('Weight out of', {
                                    upTo: maxPossibleWeight - maxValue,
                                })}
                            </StyledText>
                        </StyledFormControl>
                    ),
                    <InlineTrigger
                        icon={<IconPlusCircleOutline size="s" />}
                        onClick={() => setShowWeigthInput(true)}
                        text={tr('Add weight')}
                    />,
                )}
            </StyledWeightFieldWrapper>
        );
    },
);
interface ErrorMessage {
    message?: string;
}

interface CriteriaTitleFieldProps {
    name: 'title';
    value?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (...args: any[]) => void;
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
    const { themeId } = usePageContext();
    const { selected, title } = errors;

    const icon = useMemo(() => {
        if (mode === 'goal') {
            if (selectedItem && selectedItem.stateColor) {
                const color = selectedItem.stateColor || 1;
                const sat = color === 1 ? 0 : undefined;

                return <IconTargetOutline size="s" color={colorLayer(color, 10, sat)[themeId]} />;
            }

            return <IconSearchOutline size="s" color={gray7} />;
        }
    }, [mode, selectedItem, themeId]);

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
        <FormControl variant="outline" error={error?.message != null}>
            <FormControlInput iconLeft={icon} value={value} onChange={onChange} name={name}>
                {nullable(error?.message, (message) => (
                    <FormControlError>{message}</FormControlError>
                ))}
            </FormControlInput>
        </FormControl>
    );
};

export const CriteriaForm = forwardRef<HTMLDivElement, CriteriaFormProps>(
    (
        {
            defaultMode = 'simple',
            onInputChange,
            onItemChange,
            onModeChange,
            onSubmit,
            onCancel,
            items,
            withModeSwitch,
            renderItem,
            validityData,
            validateBindingsFor,
            values,
        },
        ref,
    ) => {
        const { control, watch, setValue, register, resetField, handleSubmit, reset, setError, trigger } =
            useForm<CriteriaFormValues>({
                resolver: zodResolver(patchZodSchema(validityData, validateBindingsFor, values)),
                defaultValues: {
                    mode: defaultMode,
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
        const mode = watch('mode', defaultMode);

        useEffect(() => {
            const sub = watch((currentValues, { name, type }) => {
                if (type === 'change') {
                    if (name === 'title') {
                        if (currentValues.mode === 'goal') {
                            onInputChange?.(currentValues.title);
                        }

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
                    onModeChange?.(currentValues.mode as NonNullable<CriteriaFormMode>);
                    if (currentValues.title) {
                        trigger('title');
                    }
                }
            });

            return () => sub.unsubscribe();
        }, [watch, onInputChange, onItemChange, onModeChange, resetField, setError, trigger]);

        const handleSelectItem = useCallback(
            ([item]: SuggestItem[]) => {
                setValue('selected', item);
                setValue('title', item.title);
            },
            [setValue],
        );

        const handleCancel = useCallback(() => {
            reset({
                selected: undefined,
                title: undefined,
            });
            onCancel?.();
        }, [reset, onCancel]);

        const isTitleFilled = useMemo(() => {
            if (mode === 'simple') {
                return !!title;
            }

            if (mode === 'goal') {
                return !!(title && selected?.id);
            }

            return false;
        }, [mode, title, selected?.id]);

        return (
            <div ref={ref}>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <AutoComplete
                        mode="single"
                        items={items}
                        onChange={handleSelectItem}
                        renderItem={renderItem}
                        keyGetter={keyGetter}
                    >
                        <Controller
                            name="title"
                            control={control}
                            render={({ field, formState }) => (
                                <CriteriaTitleField
                                    mode={mode as CriteriaFormMode}
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
                                    <StyledAutoCompleteRadiosWrapper>
                                        <AutoCompleteRadioGroup
                                            title={tr('Mode')}
                                            items={radios}
                                            {...field}
                                            onChange={(val) => setValue('mode', val.value)}
                                        />
                                    </StyledAutoCompleteRadiosWrapper>
                                )}
                            />
                        ))}
                        <StyledFormRow>
                            {nullable(isTitleFilled, () => (
                                <Controller
                                    name="weight"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <CriteriaWeightField
                                            {...field}
                                            maxValue={validityData.sumOfCriteria}
                                            error={fieldState.error}
                                            visible={values?.weight != null && Number(values.weight) > 0}
                                        />
                                    )}
                                />
                            ))}
                            <StyledFormControlsWrapper>
                                <Button
                                    type="submit"
                                    text={isEditMode ? tr('Save') : tr('Add')}
                                    view="primary"
                                    outline
                                />
                                <Button text={tr('Cancel')} view="default" outline onClick={handleCancel} />
                            </StyledFormControlsWrapper>
                        </StyledFormRow>
                        {nullable(mode !== 'simple' && !isTitleFilled, () => (
                            <AutoCompleteList title={tr('Suggestions')} />
                        ))}
                    </AutoComplete>
                    <input type="hidden" {...register('id')} />
                    <input type="hidden" {...register('selected.id')} />
                    <input type="hidden" {...register('selected.title')} />
                </Form>
            </div>
        );
    },
);
