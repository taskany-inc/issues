import React, { useState, useCallback, forwardRef, ReactEventHandler, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormInput, TableRow, TableCell } from '@taskany/bricks';
import { IconPlusCircleOutline, IconTargetOutline } from '@taskany/icons';
import { gray7, gray8 } from '@taskany/colors';
import { Controller, UseFormSetError, useForm } from 'react-hook-form';
import { Goal } from '@prisma/client';
import Popup from '@taskany/bricks/components/Popup';
import { z } from 'zod';

import { InlineTrigger } from '../InlineTrigger';
import { AddCriteriaScheme, criteriaSchema, updateCriteriaSchema } from '../../schema/criteria';
import { GoalSuggest } from '../GoalSuggest';
import { InlineForm } from '../InlineForm';
import { Keyboard } from '../Keyboard';
import { Tip } from '../Tip';

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

    & ~ div {
        top: 50%;
    }
`;

const StyledTableRow = styled(TableRow)`
    /* more specific above base style rules */
    && {
        flex-basis: auto;
    }
`;

const StyledTableCell = styled(TableCell)`
    flex-wrap: nowrap;
    display: flex;
    align-items: center;

    & > div,
    & > span {
        flex: 1;
        align-self: center;
    }
`;

const StyledSubmitButton = styled(Button)`
    display: inline-flex;
    align-items: center;
    justify-content: center;
`;

interface WeightFieldProps {
    name: 'weight';
    value?: string;
    onChange: ReactEventHandler<HTMLInputElement>;
    error?: { message?: string };
    maxValue: number;
    setError: UseFormSetError<AddCriteriaScheme>;
}

const WeightField = forwardRef<HTMLInputElement, WeightFieldProps>(
    ({ error, maxValue, setError, value, onChange, name }, ref) => {
        const handleChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
            (event) => {
                onChange(event);

                const { value } = event.target;

                const parsedValue = +value;
                let message: string | undefined;

                if (!Number.isNaN(parsedValue)) {
                    if (parsedValue < minPossibleWeight || maxValue + parsedValue > maxPossibleWeigth) {
                        message = tr
                            .raw('Weight must be in range', {
                                upTo: `${maxPossibleWeigth - maxValue}`,
                            })
                            .join('');
                    }
                } else {
                    message = tr('Weight must be integer');
                }

                setError('weight', { message });
            },
            [setError, maxValue, onChange],
        );

        return (
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
                onChange={handleChange}
                ref={ref}
            />
        );
    },
);

interface CriteriaTitleFieldProps {
    name: 'title';
    value?: string;
    titles: string[];
    isItemSelected?: boolean;
    error?: { message?: string };
    onSelect: <T extends Goal>(goal: T) => void;
    onChange: ReactEventHandler<HTMLInputElement>;
    setError: UseFormSetError<AddCriteriaScheme>;
}

const CriteriaTitleField = forwardRef<HTMLInputElement, CriteriaTitleFieldProps>(
    ({ name, value = '', error, onSelect, onChange, titles = [], setError, isItemSelected }, ref) => {
        const [type, setType] = useState<'plain' | 'search'>(!isItemSelected ? 'plain' : 'search');
        const [popupVisible, setPopupVisible] = useState(false);
        const btnRef = useRef<HTMLButtonElement>(null);

        const onlyUniqueTitleHandler = useCallback<React.FocusEventHandler<HTMLInputElement>>(
            (event) => {
                const { value } = event.target;

                if (titles.some((t) => t === value)) {
                    setError('title', {
                        message: tr('Title must be unique'),
                    });
                }
            },
            [titles, setError],
        );

        return (
            <>
                <Button
                    type="button"
                    view={type === 'search' ? 'primary' : 'default'}
                    brick="right"
                    outline
                    iconLeft={<IconTargetOutline size="xs" noWrap />}
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
                            <StyledFormInput
                                autoFocus
                                brick="center"
                                name={name}
                                onChange={onChange}
                                placeholder={tr('Enter goal name')}
                                onBlur={onlyUniqueTitleHandler}
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
                        onBlur={onlyUniqueTitleHandler}
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
    renderTrigger?: React.ComponentProps<typeof InlineForm>['renderTrigger'];
}
interface CriteriaFormPropsWithSchema extends CriteriaFormProps {
    schema: Zod.Schema;
    values?: z.infer<CriteriaFormPropsWithSchema['schema']>;
    btnText: string;
    onSubmit: (values: CriteriaFormPropsWithSchema['values']) => void;
}

const CriteriaForm: React.FC<CriteriaFormPropsWithSchema> = ({
    onSubmit,
    goalId,
    validityData,
    btnText,
    schema,
    values,
    onReset,
    renderTrigger,
}) => {
    const {
        handleSubmit,
        control,
        register,
        reset,
        setValue,
        setError,
        watch,
        formState: { isSubmitSuccessful },
    } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
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
    const title = watch('title');

    useEffect(() => {
        if (!title) {
            setValue('goalAsGriteria', undefined);
        }
    }, [title, setValue]);

    return (
        <StyledTableRow align="center">
            <InlineForm
                renderTrigger={renderTrigger}
                onSubmit={handleSubmit(onSubmit)}
                onReset={onResetHandler}
                isSubmitted={isSubmitSuccessful}
                tip={
                    <Tip>
                        {tr.raw('Press key to add criteria', {
                            key: <Keyboard key="cmd/enter" size="s" command enter />,
                        })}
                    </Tip>
                }
            >
                <StyledTableCell col={5} align="start">
                    <Controller
                        name="title"
                        control={control}
                        render={({ field, fieldState }) => (
                            <CriteriaTitleField
                                {...field}
                                error={fieldState.error}
                                setError={setError}
                                onSelect={handleSelectGoal}
                                titles={validityData.title}
                                isItemSelected={selectedGoalId != null && !!selectedGoalId.id}
                            />
                        )}
                    />
                </StyledTableCell>
                <StyledTableCell col={4} align="start">
                    <Controller
                        name="weight"
                        control={control}
                        render={({ field, fieldState }) => (
                            <WeightField
                                {...field}
                                error={fieldState.error}
                                maxValue={validityData.sum}
                                setError={setError}
                            />
                        )}
                    />
                    <StyledSubmitButton brick="left" view="primary" text={btnText} size="m" type="submit" outline />
                </StyledTableCell>
                <input type="hidden" {...register('goalId')} />
                <input type="hidden" {...register('goalAsGriteria.id')} />
            </InlineForm>
        </StyledTableRow>
    );
};

export const AddCriteriaForm: React.FC<
    CriteriaFormProps & { onSubmit: (val: z.infer<typeof criteriaSchema>) => void }
> = ({ validityData, onSubmit, goalId, onReset }) => {
    return (
        <CriteriaForm
            schema={criteriaSchema}
            btnText={tr('Add')}
            goalId={goalId}
            onSubmit={onSubmit}
            onReset={onReset}
            validityData={validityData}
            renderTrigger={({ onClick }) => (
                <StyledInlineTrigger
                    text={tr('Add achievement criteria')}
                    icon={<IconPlusCircleOutline noWrap size="s" />}
                    onClick={onClick}
                />
            )}
        />
    );
};

export const EditCriteriaForm: React.FC<
    CriteriaFormProps & {
        values: z.infer<typeof updateCriteriaSchema>;
        onSubmit: (val: z.infer<typeof updateCriteriaSchema>) => void;
    }
> = ({ validityData, onSubmit, goalId, onReset, values }) => {
    return (
        <CriteriaForm
            schema={updateCriteriaSchema}
            btnText={tr('Save')}
            goalId={goalId}
            onSubmit={onSubmit}
            onReset={onReset}
            validityData={validityData}
            values={values}
        />
    );
};
