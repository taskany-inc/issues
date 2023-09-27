import React, { useState, useCallback, forwardRef, ReactEventHandler, useRef, ChangeEvent } from 'react';
import styled from 'styled-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormInput, TableRow, TableCell, Popup, InlineForm, Tip } from '@taskany/bricks';
import { IconPlusCircleOutline, IconTargetOutline } from '@taskany/icons';
import { gray7, gray8 } from '@taskany/colors';
import { Controller, useForm } from 'react-hook-form';
import { Goal } from '@prisma/client';
import { z } from 'zod';

import { InlineTrigger } from '../InlineTrigger';
import { criteriaSchema, updateCriteriaSchema } from '../../schema/criteria';
import { GoalSuggest } from '../GoalSuggest';

import { tr } from './CriteriaForm.i18n';

const maxPossibleWeigth = 100;
const minPossibleWeight = 1;

const StyledInlineTrigger = styled(InlineTrigger)`
    display: inline-flex;
    color: ${gray8};
    line-height: 28px;
`;

const StyledFormInput = styled(FormInput)`
    font-size: 14px;
    font-weight: normal;
    padding: 5px 10px;
    flex: 1;

    border: 1px solid ${gray7};
    box-sizing: border-box;
`;

const StyledTableCell = styled(TableCell)`
    flex-wrap: nowrap;
    display: flex;
    align-items: center;
`;

const StyledSubmitButton = styled(Button)`
    display: inline-flex;
    align-items: center;
    justify-content: center;
`;

const StyledGoalSuggest = styled(GoalSuggest)`
    flex: 1;
`;

interface WeightFieldProps {
    name: 'weight';
    value?: string;
    onChange: ReactEventHandler<HTMLInputElement>;
    error?: { message?: string };
    maxValue: number;
}

const WeightField = forwardRef<HTMLInputElement, WeightFieldProps>(
    ({ error, maxValue, value, onChange, name }, ref) => (
        <StyledFormInput
            autoComplete="off"
            name={name}
            value={value}
            error={error?.message != null ? error : undefined}
            placeholder={tr
                .raw('Weight', {
                    upTo: maxPossibleWeigth - maxValue,
                })
                .join('')}
            brick="center"
            onChange={onChange}
            ref={ref}
        />
    ),
);

interface CriteriaTitleFieldProps {
    name: 'title';
    value?: string;
    titles: string[];
    isItemSelected?: boolean;
    error?: { message?: string };
    onSelect: <T extends Goal>(goal: T) => void;
    onChange: ReactEventHandler<HTMLInputElement>;
}

const CriteriaTitleField = forwardRef<HTMLInputElement, CriteriaTitleFieldProps>(
    ({ name, value = '', error, onSelect, onChange, isItemSelected }, ref) => {
        const [type, setType] = useState<'plain' | 'search'>(!isItemSelected ? 'plain' : 'search');
        const [popupVisible, setPopupVisible] = useState(false);
        const btnRef = useRef<HTMLButtonElement>(null);

        return (
            <>
                <Button
                    type="button"
                    view={type === 'search' ? 'primary' : 'default'}
                    brick="right"
                    outline
                    iconLeft={<IconTargetOutline size="xs" />}
                    onClick={() => setType((prev) => (prev === 'search' ? 'plain' : 'search'))}
                    onMouseEnter={() => setPopupVisible(true)}
                    onMouseLeave={() => setPopupVisible(false)}
                    ref={btnRef}
                />

                {type === 'search' ? (
                    <StyledGoalSuggest
                        value={isItemSelected ? undefined : value}
                        showSuggest={!isItemSelected}
                        onChange={onSelect}
                        renderInput={(inputProps) => (
                            <StyledFormInput
                                autoFocus
                                brick="center"
                                name={name}
                                onChange={onChange}
                                placeholder={tr('Enter goal name')}
                                error={error}
                                {...inputProps}
                                value={inputProps.value || value}
                                ref={ref}
                            />
                        )}
                    />
                ) : (
                    <StyledFormInput
                        autoFocus
                        brick="center"
                        value={value}
                        name={name}
                        onChange={onChange}
                        placeholder={tr('Enter criteria')}
                        error={error}
                        ref={ref}
                    />
                )}

                <Popup reference={btnRef} visible={popupVisible} placement="top-start">
                    <Tip>{tr('Search by goals')}</Tip>
                </Popup>
            </>
        );
    },
);

interface CriteriaFormProps {
    onReset?: () => void;
    goalId: string;
    validityData: {
        sum: number;
        title: string[];
    };
    renderTrigger: React.ComponentProps<typeof InlineForm>['renderTrigger'];
}
interface CriteriaFormPropsWithSchema extends CriteriaFormProps {
    schema: Zod.Schema;
    values?: z.infer<CriteriaFormPropsWithSchema['schema']>;
    actionBtnText: string;
    onSubmit: (values: CriteriaFormPropsWithSchema['values']) => void;
}

const CriteriaForm: React.FC<CriteriaFormPropsWithSchema> = ({
    onSubmit,
    goalId,
    validityData,
    actionBtnText,
    schema,
    values,
    onReset,
    renderTrigger,
}) => {
    const { handleSubmit, control, register, reset, setValue, watch } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        values,
    });

    const handleSelectGoal = useCallback(
        (goal: Goal) => {
            if (goal != null) {
                setValue('title', goal.title);
                setValue('goalAsGriteria', { id: goal.id });
            }
        },
        [setValue],
    );

    const onResetHandler = useCallback(() => {
        reset({
            title: '',
            weight: '',
            goalAsGriteria: undefined,
            goalId,
        });

        onReset?.();
    }, [goalId, reset, onReset]);

    const selectedGoalId = watch('goalAsGriteria');

    const onChange = useCallback(
        (fn: (e: ChangeEvent<HTMLInputElement>) => void) => {
            return (e: ChangeEvent<HTMLInputElement>) => {
                if (!e.target.value) {
                    setValue('goalAsGriteria', undefined);
                }

                fn(e);
            };
        },
        [setValue],
    );

    return (
        <InlineForm renderTrigger={renderTrigger} onSubmit={handleSubmit(onSubmit)} onReset={onResetHandler}>
            <TableRow align="center">
                <StyledTableCell col={5} align="center">
                    <Controller
                        name="title"
                        control={control}
                        render={({ field, fieldState }) => (
                            <CriteriaTitleField
                                {...field}
                                error={fieldState.error}
                                onSelect={handleSelectGoal}
                                onChange={onChange(field.onChange)}
                                titles={validityData.title}
                                isItemSelected={selectedGoalId != null && !!selectedGoalId.id}
                            />
                        )}
                    />
                </StyledTableCell>
                <StyledTableCell col={4} align="center">
                    <Controller
                        name="weight"
                        control={control}
                        render={({ field, fieldState }) => (
                            <WeightField {...field} error={fieldState.error} maxValue={validityData.sum} />
                        )}
                    />
                    <StyledSubmitButton
                        brick="left"
                        view="primary"
                        text={actionBtnText}
                        size="m"
                        type="submit"
                        outline
                    />
                </StyledTableCell>
            </TableRow>
            <input type="hidden" {...register('goalId')} />
            <input type="hidden" {...register('goalAsGriteria.id')} />
        </InlineForm>
    );
};

function patchZodSchema<T extends typeof criteriaSchema | typeof updateCriteriaSchema>(
    schema: T,
    data: CriteriaFormProps['validityData'],
) {
    const patched = schema.merge(
        z.object({
            title: schema.shape.title.refine((val) => !data.title.some((t) => t === val), {
                message: tr('Title must be unique'),
            }),
            // INFO: https://github.com/colinhacks/zod#abort-early
            weight: schema.shape.weight.superRefine((val, ctx): val is string => {
                if (!val || !val.length) {
                    return z.NEVER;
                }

                const parsed = Number(val);

                if (Number.isNaN(parsed)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: tr('Weight must be integer'),
                    });
                }

                if (parsed < minPossibleWeight || data.sum + parsed > maxPossibleWeigth) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: tr
                            .raw('Weight must be in range', {
                                upTo: `${maxPossibleWeigth - data.sum}`,
                            })
                            .join(''),
                    });
                }

                return z.NEVER;
            }),
        }),
    );

    return patched;
}

export const AddCriteriaForm: React.FC<
    Omit<CriteriaFormProps, 'renderTrigger'> & { onSubmit: (val: z.infer<typeof criteriaSchema>) => void }
> = ({ validityData, onSubmit, goalId, onReset }) => {
    return (
        <CriteriaForm
            schema={patchZodSchema(criteriaSchema, validityData)}
            actionBtnText={tr('Add')}
            goalId={goalId}
            onSubmit={onSubmit}
            onReset={onReset}
            validityData={validityData}
            renderTrigger={({ onClick }) => (
                <StyledInlineTrigger
                    text={tr('Add achievement criteria')}
                    icon={<IconPlusCircleOutline size="s" />}
                    onClick={onClick}
                />
            )}
        />
    );
};

export const EditCriteriaForm: React.FC<
    Omit<CriteriaFormProps, 'renderTrigger'> & {
        values: z.infer<typeof updateCriteriaSchema>;
        onSubmit: (val: z.infer<typeof updateCriteriaSchema>) => void;
    }
> = ({ validityData, onSubmit, goalId, onReset, values }) => {
    return (
        <CriteriaForm
            schema={patchZodSchema(updateCriteriaSchema, validityData)}
            actionBtnText={tr('Save')}
            goalId={goalId}
            onSubmit={onSubmit}
            onReset={onReset}
            validityData={validityData}
            values={values}
            renderTrigger={() => null}
        />
    );
};
