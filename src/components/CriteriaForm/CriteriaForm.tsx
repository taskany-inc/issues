import React, { useState, useEffect, useCallback, useReducer, useRef, forwardRef, ReactEventHandler } from 'react';
import styled from 'styled-components';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ComboBox,
    Button,
    GoalIcon,
    nullable,
    FormInput,
    useClickOutside,
    useKeyboard,
    KeyCode,
    PlusIcon,
} from '@taskany/bricks';
import { gray7, gray8 } from '@taskany/colors';
import { Controller, UseFormSetError, useForm } from 'react-hook-form';
import { Goal, State } from '@prisma/client';

import { InlineTrigger } from '../InlineTrigger';
import { AddCriteriaScheme, criteriaSchema } from '../../schema/criteria';
import { Table, TableRow, TitleItem, ContentItem, Title, TextItem, TitleContainer } from '../Table';
import { StateDot } from '../StateDot';
import { trpc } from '../../utils/trpcClient';

import { tr } from './CriteriaForm.i18n';

const maxPossibleWeigth = 100;
const minPossibleWeight = 1;

const StyledInlineTrigger = styled(InlineTrigger)`
    display: inline-flex;
    color: ${gray8};
    line-height: 28px;
`;

const StyledTableResults = styled(Table)`
    position: relative;
    grid-template-columns: 30px 210px 40px minmax(max-content, 120px);
    width: fit-content;
    z-index: 2;
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
    error?: { message?: string };
    onSelect: <T extends Goal>(goal: T) => void;
    onChange: ReactEventHandler<HTMLInputElement>;
    setError: UseFormSetError<AddCriteriaScheme>;
}

export const CriteriaTitleField = forwardRef<HTMLInputElement, CriteriaTitleFieldProps>(
    ({ name, value = '', error, onSelect, onChange, titles = [], setError }, ref) => {
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

        const handleInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
            (event) => {
                const { value } = event.target;

                setQuery(() => {
                    const isSearchInput = value[0] === '#';

                    return [value, isSearchInput ? 'search' : 'plain'];
                });

                onChange(event);

                setCompletionVisibility(true);
            },
            [onChange],
        );

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
                renderInput={({ value, ref }) => (
                    <StyledFormInput
                        autoFocus
                        error={error?.message != null ? error : undefined}
                        placeholder={tr('Criteria or Goal')}
                        name={name}
                        brick="right"
                        onChange={handleInputChange}
                        onBlur={onlyUniqueTitleHandler}
                        value={value}
                        ref={ref}
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
    const prevVisibleRef = useRef(formVisible);

    const {
        handleSubmit,
        control,
        reset,
        setValue,
        setError,
        formState: { isSubmitSuccessful },
    } = useForm<AddCriteriaScheme>({
        resolver: zodResolver(criteriaSchema),
        reValidateMode: 'onChange',
        defaultValues: {
            goalId,
            title: '',
            weight: '',
            goalAsGriteria: null,
        },
    });

    useEffect(() => {
        if (!formVisible && prevVisibleRef.current !== formVisible) {
            reset({
                title: '',
                weight: '',
                goalAsGriteria: null,
                goalId,
            });
        }

        prevVisibleRef.current = formVisible;
    }, [formVisible, reset, goalId]);

    useEffect(() => {
        if (isSubmitSuccessful) {
            toggle();
        }
    }, [isSubmitSuccessful]);

    const onClickOutside = useCallback(() => {
        if (formVisible) {
            toggle();
        }
    }, [formVisible]);

    useClickOutside(wrapperRef, onClickOutside);

    const handleSelectGoal = useCallback(
        (goal: Goal) => {
            if (goal != null) {
                setValue('title', goal.title);
                setValue('goalAsGriteria', { id: goal.id });
            }
        },
        [setValue],
    );

    const [onESC] = useKeyboard(
        [KeyCode.Escape],
        (event) => {
            if (event.target && wrapperRef.current?.contains(event.target as Node) && formVisible) {
                toggle();
            }
        },
        {
            capture: true,
            event: 'keydown',
        },
    );

    return (
        <div ref={wrapperRef}>
            {formVisible ? (
                <form onSubmit={handleSubmit(onSubmit)} {...onESC}>
                    <StyledTableRow>
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
                                />
                            )}
                        />
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
                        <StyledSubmitButton
                            brick="left"
                            view="primary"
                            text={tr('Add')}
                            size="m"
                            type="submit"
                            outline
                        />
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
                <StyledInlineTrigger
                    text={tr('Add achievement criteria')}
                    icon={<PlusIcon noWrap size="s" />}
                    onClick={toggle}
                />
            )}
        </div>
    );
};
