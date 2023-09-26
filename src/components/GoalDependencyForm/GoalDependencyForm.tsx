import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, Button, InlineForm } from '@taskany/bricks';
import { gray7 } from '@taskany/colors';
import { IconTargetOutline, IconPlusCircleOutline } from '@taskany/icons';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';

import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { dependencyKind, ToggleGoalDependency, toggleGoalDependencySchema } from '../../schema/goal';
import { GoalSuggest } from '../GoalSuggest';
import { InlineTrigger } from '../InlineTrigger';

import { tr } from './GoalDependencyForm.i18n';

const StyledFormInput = styled(FormInput)`
    font-size: 14px;
    font-weight: normal;
    padding: 5px 10px;

    border: 1px solid ${gray7};
    border-right: 0;
    box-sizing: border-box;
`;

const StyledInlineTrigger = styled(InlineTrigger)`
    line-height: 28px;
`;

const StyledTableRow = styled.div`
    display: grid;
    grid-template-columns: 35px minmax(calc(240px), 20%) max-content;
`;

interface GoalDependencyAddFormProps {
    goalId: string;
    kind: dependencyKind;
    onSubmit: (values: ToggleGoalDependency) => void;
    isEmpty: boolean;
}

export const GoalDependencyAddForm: React.FC<GoalDependencyAddFormProps> = ({ goalId, kind, isEmpty, onSubmit }) => {
    const [query, setQuery] = useState('');

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(toggleGoalDependencySchema),
        mode: 'onChange',
        defaultValues: {
            relation: { id: '' },
            id: goalId,
            kind,
        },
    });

    const selectedGoalId = watch('relation.id');

    const resetFormHandler = useCallback(() => {
        setQuery('');

        reset({
            relation: { id: '' },
            id: goalId,
            kind,
        });
    }, [reset, goalId, kind]);

    const handleInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
        (event) => {
            const queryValue = event.target.value;

            if (selectedGoalId) {
                resetFormHandler();
                return;
            }

            setQuery(queryValue);
        },
        [resetFormHandler, selectedGoalId],
    );

    const handleGoalSelect = useCallback(
        (goal: NonNullable<GoalByIdReturnType>) => {
            setQuery(`${goal.projectId}-${goal.scopeId}`);
            setValue('relation.id', goal.id);
        },
        [setValue],
    );

    const translate = useMemo(() => {
        return {
            default: tr('Add dependency'),
            [dependencyKind.blocks]: tr('Add blocking dependency'),
            [dependencyKind.dependsOn]: tr('Add dependency'),
            [dependencyKind.relatedTo]: tr('Add related dependency'),
        };
    }, []);

    return (
        <InlineForm
            renderTrigger={(props) => (
                <StyledInlineTrigger
                    text={isEmpty ? translate[kind] : translate.default}
                    icon={<IconPlusCircleOutline noWrap size="s" />}
                    {...props}
                />
            )}
            onSubmit={handleSubmit(onSubmit)}
            onReset={resetFormHandler}
        >
            <StyledTableRow>
                <Button
                    type="button"
                    view="primary"
                    brick="right"
                    outline
                    iconLeft={<IconTargetOutline size="xs" noWrap />}
                />
                <GoalSuggest
                    value={selectedGoalId ? undefined : query}
                    showSuggest={!selectedGoalId}
                    onChange={handleGoalSelect}
                    renderInput={(inputProps) => (
                        <StyledFormInput
                            autoFocus
                            autoComplete="off"
                            onChange={handleInputChange}
                            brick="center"
                            error={errors.relation?.id}
                            {...inputProps}
                            value={inputProps.value || query}
                        />
                    )}
                />
                <Button text={tr('Add')} brick="left" type="submit" view="primary" outline />
            </StyledTableRow>
            <input type="hidden" {...register('relation.id')} />
            <input type="hidden" {...register('id')} />
            <input type="hidden" {...register('kind')} />
        </InlineForm>
    );
};
