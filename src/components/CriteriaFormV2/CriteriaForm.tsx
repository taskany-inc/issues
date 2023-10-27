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

import { tr } from './CriteriaFormV2.i18n';

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

const schema = z.object({
    mode: z.enum<CriteriaFormMode, Readonly<[CriteriaFormMode, CriteriaFormMode]>>(['simple', 'goal']),
    weight: z.string().optional(),
    title: z.string().optional(),
    selected: z
        .object({
            id: z.string(),
            title: z.string(),
        })
        .nullish(),
});

type CriteriaFormValues = z.infer<typeof schema>;

function patchZodSchema(data: ValidityData) {
    return schema
        .merge(
            z.object({
                /* INFO: https://github.com/colinhacks/zod#abort-early */
                weight: schema.shape.weight.superRefine((val, ctx): val is string => {
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
                            message: tr('Passed weight is not in range'),
                        });
                    }

                    return z.NEVER;
                }),
            }),
        )
        .superRefine((val, ctx) => {
            if (val.mode === 'simple') {
                if (!val.title) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: tr('Title is required'),
                        path: ['title'],
                    });
                } else if (val.title.length < 1) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: tr('Title must be longer than 1 symbol'),
                        path: ['title'],
                    });
                } else if (data.title.some((t) => t === val.title)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: tr('Title must be unique'),
                        path: ['title'],
                    });
                }
            }
            if (val.mode === 'goal' && !val.selected?.id.length) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: tr('Goal must be selected'),
                    path: ['selected'],
                });
            }

            return z.NEVER;
        });
}

interface CriteriaFormProps {
    items: SuggestItem[];
    defaultMode?: CriteriaFormMode;
    withModeSwitch?: boolean;
    values?: Partial<CriteriaFormValues>;
    validityData: { title: string[]; sumOfCriteria: number };

    onModeChange?: (mode: CriteriaFormMode) => void;
    onSubmit: (values: CriteriaFormValues) => void;
    onCancel: () => void;
    onItemChange?: (item?: SuggestItem) => void;
    onInputChange?: (value?: string) => void;

    renderItem: React.ComponentProps<typeof AutoComplete<SuggestItem>>['renderItem'];
}

const keyGetter = (item: SuggestItem) => item.id;

interface WeightFieldProps {
    name: 'weight';
    value?: string;
    onChange: ReactEventHandler<HTMLInputElement>;
    error?: { message?: string };
    maxValue: number;
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

const CriteriaWeightField = forwardRef<HTMLInputElement, WeightFieldProps>(
    ({ error, maxValue, value, onChange, name }, ref) => {
        const [showWeigthInput, setShowWeigthInput] = useState(false);
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
                                autoFocus
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

interface CriteriaTitleFieldProps {
    name: 'title';
    value?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (...args: any[]) => void;
    errors?: {
        title?: { message?: string };
        selected?: { message?: string };
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
            return selected;
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

export const CriteriaForm: React.FC<CriteriaFormProps> = ({
    defaultMode,
    onInputChange,
    onItemChange,
    onModeChange,
    onSubmit,
    onCancel,
    items,
    withModeSwitch,
    renderItem,
    validityData,
    values,
}) => {
    const { control, watch, setValue, register, resetField, handleSubmit, reset, setError } =
        useForm<CriteriaFormValues>({
            resolver: zodResolver(patchZodSchema(validityData)),
            defaultValues: { ...values, mode: defaultMode },
            mode: 'onChange',
            reValidateMode: 'onChange',
        });

    const isEditMode = values != null;

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
                    onInputChange?.(currentValues.title);

                    if (currentValues.selected != null && currentValues.selected.id != null) {
                        resetField('selected');
                        resetField('weight');
                    }
                }
            }

            if (name === 'selected' || name === 'selected.id' || name === 'selected.title') {
                onItemChange?.(currentValues.selected as Required<SuggestItem>);
                setError('selected', { message: undefined });
            }

            if (name === 'mode') {
                onModeChange?.(currentValues.mode as NonNullable<CriteriaFormMode>);
                setError('title', { message: undefined });
            }
        });

        return () => sub.unsubscribe();
    }, [watch, onInputChange, onItemChange, onModeChange, resetField, setError]);

    const handleSelectItem = useCallback(
        ([item]: SuggestItem[]) => {
            setValue('selected', item);
            setValue('title', item.title);
        },
        [setValue],
    );

    const handleCancel = useCallback(() => {
        reset({
            selected: null,
            title: undefined,
        });
        onCancel();
    }, [reset, onCancel]);

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
                            <AutoCompleteRadioGroup
                                title={tr('Mode')}
                                items={radios}
                                {...field}
                                onChange={(val) => setValue('mode', val.value)}
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
                                <CriteriaWeightField
                                    {...field}
                                    maxValue={validityData.sumOfCriteria}
                                    error={fieldState.error}
                                />
                            )}
                        />
                    ))}
                    <StyledFormControlsWrapper>
                        <Button type="submit" text={isEditMode ? tr('Save') : tr('Add')} view="primary" outline />
                        <Button text={tr('Cancel')} view="default" outline onClick={handleCancel} />
                    </StyledFormControlsWrapper>
                </StyledFormRow>
                <AutoCompleteList title={tr('Suggestions')} />
            </AutoComplete>
            <input type="hidden" {...register('selected.id')} />
            <input type="hidden" {...register('selected.title')} />
        </Form>
    );
};
