import React, { useState, useCallback, forwardRef, ReactEventHandler, useRef, ChangeEvent } from 'react';
import styled from 'styled-components';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    TableRow,
    TableCell,
    Popup,
    InlineForm,
    Tip,
    FormControl,
    FormControlInput,
    FormControlError,
    nullable,
} from '@taskany/bricks';
import { IconPlusCircleOutline, IconTargetOutline } from '@taskany/icons';
import { Controller, useForm } from 'react-hook-form';
import { Goal } from '@prisma/client';
import { z } from 'zod';

import { InlineTrigger } from '../InlineTrigger';
import {
    ValidityData,
    criteriaSchema,
    maxPossibleWeight,
    patchZodSchema,
    ValidityMessage,
} from '../../schema/criteria';
import { GoalSuggest } from '../GoalSuggest';

import { tr } from './CriteriaForm.i18n';

const StyledInlineTrigger = styled(InlineTrigger)`
    width: fit-content;
`;

const StyledTableCell = styled(TableCell)`
    flex: 0;
`;

const StyledFormControl = styled(FormControl)`
    height: 28px; // input height
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
        <StyledFormControl brick="center" variant="outline">
            <FormControlInput
                autoComplete="off"
                autoFocus
                name={name}
                value={value}
                onChange={onChange}
                placeholder={tr
                    .raw('Weight', {
                        upTo: maxPossibleWeight - maxValue,
                    })
                    .join('')}
                ref={ref}
            />
            {nullable(error, (err) => (
                <FormControlError error={err} />
            ))}
        </StyledFormControl>
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
                    <GoalSuggest
                        value={isItemSelected ? undefined : value}
                        showSuggest={!isItemSelected}
                        onChange={onSelect}
                        renderInput={(inputProps) => (
                            <StyledFormControl brick="center" variant="outline">
                                <FormControlInput
                                    autoFocus
                                    name={name}
                                    onChange={onChange}
                                    placeholder={tr('Enter goal name')}
                                    {...inputProps}
                                    value={inputProps.value || value}
                                    ref={ref}
                                />
                                {nullable(error, (err) => (
                                    <FormControlError error={err} />
                                ))}
                            </StyledFormControl>
                        )}
                    />
                ) : (
                    <StyledFormControl brick="center" variant="outline">
                        <FormControlInput
                            autoFocus
                            value={value}
                            name={name}
                            onChange={onChange}
                            placeholder={tr('Enter criteria')}
                            ref={ref}
                        />
                        {nullable(error, (err) => (
                            <FormControlError error={err} />
                        ))}
                    </StyledFormControl>
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
    validityData: ValidityData;
    renderTrigger?: React.ComponentProps<typeof InlineForm>['renderTrigger'];
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
                <StyledTableCell col={7} align="center">
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
                <StyledTableCell align="center" width={200}>
                    <Controller
                        name="weight"
                        control={control}
                        render={({ field, fieldState }) => (
                            <WeightField {...field} error={fieldState.error} maxValue={validityData.sum} />
                        )}
                    />
                    <Button brick="left" view="primary" text={actionBtnText} size="m" type="submit" outline />
                </StyledTableCell>
            </TableRow>
            <input type="hidden" {...register('goalId')} />
            <input type="hidden" {...register('goalAsGriteria.id')} />
        </InlineForm>
    );
};

const getErrorMessages = (data: ValidityData): ValidityMessage => ({
    uniqueTitle: tr('Title must be unique'),
    weigthIsNan: tr('Weight must be integer'),
    notInRange: tr
        .raw('Weight must be in range', {
            upTo: `${maxPossibleWeight - data.sum}`,
        })
        .join(' '),
});

export const AddCriteriaForm: React.FC<
    Omit<CriteriaFormProps, 'renderTrigger'> & { onSubmit: (val: z.infer<typeof criteriaSchema>) => void }
> = ({ validityData, onSubmit, goalId, onReset }) => {
    return (
        <CriteriaForm
            schema={patchZodSchema(criteriaSchema, validityData, getErrorMessages(validityData))}
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
