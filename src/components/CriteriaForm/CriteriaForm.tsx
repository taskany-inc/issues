import React, { useState, useEffect, useCallback, useReducer, useRef, forwardRef, ReactEventHandler } from 'react';
import styled from 'styled-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { ComboBox, Button, AddIcon, GoalIcon, nullable, FormInput, useClickOutside } from '@taskany/bricks';
import { gray7, gray8 } from '@taskany/colors';
import { Controller, UseFormRegisterReturn, UseFormSetError, useForm } from 'react-hook-form';
import { Goal, State } from '@prisma/client';

import { AddCriteriaScheme, criteriaSchema } from '../../schema/criteria';
import { Table, TableRow, TitleItem, ContentItem, Title, TextItem, TitleContainer } from '../Table';
import { StateDot } from '../StateDot';
import { errorsProvider } from '../../utils/forms';
import { trpc } from '../../utils/trpcClient';

import { tr } from './CriteriaForm.i18n';

const maxPossibleWeigth = 100;
const minPossibleWeight = 1;

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
        minmax(calc(250px + 10px /* gap of sibling table */), 20%)
        repeat(2, max-content);
`;

const StyledSubmitButton = styled(Button)`
    display: inline-flex;
    align-items: center;
    justify-content: center;
`;

interface GoalSuggestItemProps {
    title: string;
    state?: State | null;
    projectId: string;
    focused: boolean;
    onClick: () => void;
}

const GoalSuggestItem: React.FC<GoalSuggestItemProps> = ({
    onClick,
    title,
    projectId,
    state,
    focused,
}): React.ReactElement => {
    const handleClick = useCallback<React.MouseEventHandler<HTMLAnchorElement>>(
        (event) => {
            event.preventDefault();
            onClick();
        },
        [onClick],
    );

    return (
        <TableRow href="#" onClick={handleClick} focused={focused}>
            <ContentItem>
                <GoalIcon size="s" />
            </ContentItem>
            <TitleItem>
                <TitleContainer>
                    <Title>{title}</Title>
                </TitleContainer>
            </TitleItem>
            <ContentItem>
                {nullable(state, (s) => (
                    <StateDot size="m" title={s.title} hue={s.hue} />
                ))}
            </ContentItem>
            <ContentItem>
                <TextItem>{projectId}</TextItem>
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

            if (Number.isNaN(parsedValue)) {
                message = tr('Weight must be integer');
            } else if (parsedValue <= minPossibleWeight || maxValue + parsedValue > maxPossibleWeigth) {
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
            placeholder={tr
                .raw('Weight', {
                    upTo: maxPossibleWeigth - maxValue,
                })
                .join('')}
            brick="center"
            onChange={handleChange}
        />
    );
};

interface CriteriaTitleFieldProps {
    name: 'title';
    value?: string;
    titles: string[];
    errorsResolver: (field: CriteriaTitleFieldProps['name']) => { message?: string } | undefined;
    onSelect: <T extends Goal>(goal: T) => void;
    onChange: ReactEventHandler<HTMLInputElement>;
    setError: UseFormSetError<AddCriteriaScheme>;
}

export const CriteriaTitleField = forwardRef<HTMLInputElement, CriteriaTitleFieldProps>(
    ({ name, value = '', errorsResolver, onSelect, onChange, titles = [], setError }, ref) => {
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [[text, type], setQuery] = useState<[string, 'plain' | 'search']>([value, 'plain']);

        const results = trpc.goal.suggestions.useQuery(
            {
                input: text.slice(1),
                limit: 5,
            },
            {
                enabled: type === 'search' && text.length > 2,
                staleTime: 0,
                cacheTime: 0,
            },
        );

        useEffect(() => {
            if (value !== text) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                setQuery(([_, prevType]) => {
                    return [value, prevType];
                });
            }
        }, [value, text]);

        const handleInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>((event) => {
            const { value } = event.target;

            setQuery(() => {
                const isSearchInput = value[0] === '#';

                return [value, isSearchInput ? 'search' : 'plain'];
            });

            setCompletionVisibility(true);
        }, []);

        type GoalFromResults = NonNullable<typeof results.data>[number];

        const handleSelectGoal = useCallback(
            (item: GoalFromResults) => {
                if (type === 'search') {
                    onSelect(item);
                    setQuery(['', 'plain']);
                    setCompletionVisibility(false);
                }
            },
            [onSelect, type],
        );

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
            <ComboBox
                ref={ref}
                text={text}
                value={value || text}
                items={results.data}
                maxWidth={400}
                onChange={handleSelectGoal}
                visible={completionVisible}
                renderInput={(props) => (
                    <StyledFormInput
                        error={errorsResolver(name)}
                        placeholder={tr('Criteria or Goal')}
                        name={name}
                        brick="right"
                        onChange={(...args) => {
                            handleInputChange(...args);
                            onChange(...args);
                        }}
                        onBlur={onlyUniqueTitleHandler}
                        {...props}
                    />
                )}
                renderItems={(children) => (
                    <StyledTableResults columns={3}>{children as React.ReactNode}</StyledTableResults>
                )}
                renderItem={({ item, index, cursor, onClick }) => (
                    <GoalSuggestItem {...item} focused={index === cursor} onClick={() => onClick(item)} key={item.id} />
                )}
            />
        );
    },
);

interface CriteriaFormProps {
    onSubmit: (values: AddCriteriaScheme) => void;
    goalId: string;
    validityData: {
        sum: number;
        title: string[];
    };
}

export const CriteriaForm: React.FC<CriteriaFormProps> = ({ onSubmit, goalId, validityData }) => {
    const [formVisible, toggle] = useReducer((state) => !state, false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const {
        handleSubmit,
        register,
        control,
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
            goalId,
            title: '',
            weight: '',
            goalAsGriteria: null,
        },
    });

    useEffect(() => {
        if (isSubmitSuccessful) {
            reset({
                title: '',
                weight: '',
                goalAsGriteria: null,
            });
        }
    }, [isSubmitSuccessful, reset]);

    const onClickOutside = useCallback(() => {
        if (formVisible) {
            reset({
                title: '',
                weight: '',
                goalAsGriteria: null,
            });
            toggle();
        }
    }, [reset, formVisible]);

    useClickOutside(wrapperRef, onClickOutside);

    const errorResolver = errorsProvider(errors, true);

    const handleSelectGoal = useCallback(
        (goal: Goal) => {
            if (goal != null) {
                setValue('title', goal.title);
                setValue('goalAsGriteria', { id: goal.id });
            }
        },
        [setValue],
    );

    return (
        <div ref={wrapperRef}>
            {formVisible ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <StyledTableRow>
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <CriteriaTitleField
                                    {...field}
                                    errorsResolver={errorResolver}
                                    setError={setError}
                                    onSelect={handleSelectGoal}
                                    titles={validityData.title}
                                />
                            )}
                        />
                        <WeightField
                            registerProps={register('weight')}
                            errorsResolver={errorResolver}
                            maxValue={validityData.sum}
                            setError={setError}
                        />
                        <StyledSubmitButton brick="left" view="primary" text={tr('Add')} size="m" type="submit" />
                    </StyledTableRow>
                    <Controller
                        name="goalId"
                        control={control}
                        render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                        name="goalAsGriteria"
                        control={control}
                        render={({ field }) => <input type="hidden" {...field} value={field.value?.id || ''} />}
                    />
                </form>
            ) : (
                <StyledPlainButton
                    text={tr('Add achievement criteria')}
                    iconLeft={<AddIcon size="s" />}
                    view="default"
                    outline={false}
                    onClick={toggle}
                />
            )}
        </div>
    );
};
