import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { ComboBox, Button, AddIcon, Form, GoalIcon, nullable, FormInput } from '@taskany/bricks';
import { gray7, gray8 } from '@taskany/colors';
import { SubmitHandler, UseFormRegister, UseFormRegisterReturn, UseFormSetError, useForm } from 'react-hook-form';

import { AddCriteriaScheme, criteriaSchema } from '../../schema/criteria';
import { Table, TableRow, TitleItem, ContentItem, Title, TextItem, TitleContainer } from '../Table';
import { StateDot } from '../StateDot';
import { errorsProvider } from '../../utils/forms';

import { tr } from './CreateCriteriaForm.i18n';

const maxPossibleWeigth = 100;

const StyledPlainButton = styled(Button)`
    background-color: unset;
    border: none;
    padding: 0;

    color: ${gray8};

    border-radius: 0;

    &:hover:not([disabled]),
    &:focus:not([disabled]) {
        background-color: unset;
    }

    &:active:not([disabled]) {
        transform: none;
    }
`;

const StyledTableResults = styled(Table)`
    grid-template-columns: 30px 210px 40px minmax(max-content, 120px);
    width: fit-content;
`;

const StyledFormInput = styled(FormInput)`
    font-size: 14px;
    font-weight: normal;
    padding: 5px 10px;

    border: 1px solid ${gray7};
    box-sizing: border-box;

    & ~ div {
        top: 50%;
    }
`;

const StyledTableRow = styled.div`
    display: grid;
    padding-left: 14px;
    grid-template-columns:
        minmax(calc(300px + 10px /* gap of sibling table */), 30%)
        repeat(2, max-content);
`;

const StyledSubmitButton = styled(Button)`
    display: inline-flex;
    align-items: center;
    justify-content: center;
`;

const GoalSuggestItem = (props: any): React.ReactElement => {
    const handleClick = (event: any) => {
        event.preventDefault();
        props.onClick();
    };

    return (
        <TableRow href="#" onClick={handleClick} focused={props.focused}>
            <ContentItem>
                <GoalIcon size="s" />
            </ContentItem>
            <TitleItem>
                <TitleContainer>
                    <Title>{props.title}</Title>
                </TitleContainer>
            </TitleItem>
            <ContentItem>
                {nullable(props.state, (s) => (
                    <StateDot size="m" title={s?.title} hue={s?.hue} />
                ))}
            </ContentItem>
            <ContentItem>
                <TextItem>{props.projectId}</TextItem>
            </ContentItem>
        </TableRow>
    );
};

interface WeightFieldProps {
    registerProps: UseFormRegisterReturn<'weight'>;
    errorsResolver: (field: 'weight') => { message?: string } | undefined;
    maxValue: number;
    setError: UseFormSetError<AddCriteriaScheme>;
}

const WeightField: React.FC<WeightFieldProps> = ({ registerProps, errorsResolver, maxValue, setError }) => {
    const handleChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
        (event) => {
            const { value } = event.target;

            const parsedValue = parseInt(value, 10);
            let message: string | undefined;

            if (!value) {
                message = tr('Weight is required');
            } else if (Number.isNaN(parsedValue)) {
                message = tr('Weight must be integer');
            } else if (parsedValue <= 0 || maxValue + parsedValue > maxPossibleWeigth) {
                message = tr
                    .raw('Weight must be in range', {
                        upTo: `${maxPossibleWeigth - maxValue}`,
                    })
                    .join('');
            }

            setError('weight', { message });
        },
        [setError, maxValue],
    );

    return (
        <StyledFormInput
            {...registerProps}
            error={errorsResolver('weight')}
            name="weight"
            placeholder={tr('Weight')}
            brick="center"
            onChange={handleChange}
        />
    );
};

export const CreateCriteriaForm: React.FC<any> = ({ onSubmit, onSearch, items, goalId, sumOfWeights = 0 }) => {
    const [[text, type], setQuery] = useState<[string, 'plain' | 'search']>(['', 'plain']);
    const [selectedGoal, setSelectedGoal] = useState<(typeof items)[number]>(null);

    const {
        handleSubmit,
        register,
        reset,
        setValue,
        setError,
        formState: { errors, isSubmitSuccessful },
    } = useForm<AddCriteriaScheme>({
        resolver: zodResolver(criteriaSchema),
        mode: 'all',
        reValidateMode: 'onChange',
        criteriaMode: 'all',
        defaultValues: {
            linkedGoalId: goalId,
            title: '',
            weight: '',
        },
    });

    const submitHandler: SubmitHandler<AddCriteriaScheme> = (values) => {
        const data = { ...values };

        if (selectedGoal) {
            data.goalAsGriteria = selectedGoal.id;
        }

        onSubmit(data);
    };

    useEffect(() => {
        if (isSubmitSuccessful) {
            reset();
        }
    }, [isSubmitSuccessful, reset]);

    const onClickOutside = useCallback(
        (cb: () => void) => {
            reset();
            cb();
        },
        [reset],
    );

    const errorResolver = errorsProvider(errors, true);

    const handleInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>((event) => {
        const { value } = event.target;

        setQuery(() => {
            const isSearchInput = value[0] === '#';
            let val = value;

            if (isSearchInput) {
                val = val.slice(1);
            }

            return [val, isSearchInput ? 'search' : 'plain'];
        });
    }, []);

    useEffect(() => {
        if (type === 'search' && text.length) {
            onSearch(text);
        }
    }, [type, text, onSearch]);

    const handleSelectGoal = useCallback((item: (typeof items)[number]) => {
        setSelectedGoal(item);
    }, []);

    useEffect(() => {
        if (selectedGoal != null) {
            setValue('title', selectedGoal.title);
            setQuery(['', 'plain']);
            onSearch('');
        }
    }, [setValue, selectedGoal, onSearch]);

    return (
        <Form onSubmit={handleSubmit(submitHandler)}>
            <ComboBox
                items={items}
                onClickOutside={onClickOutside}
                onChange={handleSelectGoal}
                maxWidth={400}
                renderInput={({ ref, ...props }) => (
                    <StyledTableRow ref={ref}>
                        <StyledFormInput
                            {...register('title')}
                            error={errorResolver('title')}
                            {...props}
                            placeholder={tr('Criteria or Goal')}
                            name="title"
                            brick="right"
                            onChange={handleInputChange}
                        />
                        <WeightField
                            registerProps={register('weight')}
                            errorsResolver={errorResolver}
                            maxValue={sumOfWeights}
                            setError={setError}
                        />
                        <StyledSubmitButton brick="left" view="primary" text={tr('Add')} size="m" type="submit" />
                    </StyledTableRow>
                )}
                renderTrigger={(props) => (
                    <StyledPlainButton
                        text={tr('Add achivement criteria')}
                        iconLeft={<AddIcon size="s" />}
                        view="default"
                        outline={false}
                        onClick={props.onClick}
                    />
                )}
                renderItems={(children) => (
                    <StyledTableResults columns={3}>{children as React.ReactNode}</StyledTableResults>
                )}
                renderItem={({ item, index, cursor }) => (
                    <GoalSuggestItem
                        {...item}
                        focuced={index === cursor}
                        onClick={() => handleSelectGoal(item)}
                        key={item.id}
                    />
                )}
            />
        </Form>
    );
};
