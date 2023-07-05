import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, PlusIcon, Button } from '@taskany/bricks';
import { gray7 } from '@taskany/colors';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';

import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { dependencyKind, ToggleGoalDependency, toggleGoalDependencySchema } from '../../schema/goal';
import { GoalSuggest } from '../GoalSuggest';
import { InlineForm } from '../InlineForm';
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

interface GoalDependencyAddFormProps {
    goalId: string;
    kind: dependencyKind;
    onSubmit: (values: ToggleGoalDependency) => void;
    isEmpty: boolean;
}

export const GoalDependencyAddForm: React.FC<GoalDependencyAddFormProps> = ({ goalId, kind, isEmpty, onSubmit }) => {
    const [selected, setSelected] = useState<GoalByIdReturnType | null>(null);
    const [query, setQuery] = useState(['']);
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { isSubmitSuccessful, errors },
    } = useForm({
        resolver: zodResolver(toggleGoalDependencySchema),
        mode: 'onChange',
        defaultValues: {
            relation: { id: '' },
            id: goalId,
            kind,
        },
    });

    const resetFormHandler = useCallback(() => {
        setSelected(null);
        setQuery(['']);

        reset({
            relation: { id: '' },
            id: goalId,
            kind,
        });
    }, [reset, goalId, kind]);

    useEffect(() => {
        if (selected) {
            setValue('relation.id', selected.id);
        }
    }, [selected, setValue]);

    const handleInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>((event) => {
        setQuery([event.target.value]);
    }, []);

    const handleGoalSelect = useCallback((goal: NonNullable<GoalByIdReturnType>) => {
        setSelected(goal);
        setQuery([goal.projectId!, String(goal.scopeId)]);
    }, []);

    useEffect(() => {
        if (selected) {
            if (query[0] !== selected.projectId || query[1] !== String(selected.scopeId)) {
                resetFormHandler();
            }
        }
    }, [query, selected, resetFormHandler]);

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
                    icon={<PlusIcon noWrap size="s" />}
                    {...props}
                />
            )}
            isSubmitted={isSubmitSuccessful}
            onSubmit={handleSubmit(onSubmit)}
            onReset={resetFormHandler}
        >
            <GoalSuggest
                renderTrigger={() => (
                    <StyledFormInput
                        autoFocus
                        autoComplete="off"
                        value={query.join('-')}
                        onChange={handleInputChange}
                        brick="right"
                        error={errors.relation?.id}
                    />
                )}
                value={query.join('-')}
                onChange={handleGoalSelect}
            />
            <Button text={tr('Add')} brick="left" type="submit" view="primary" outline />
            <input type="hidden" {...register('relation.id')} />
            <input type="hidden" {...register('id')} />
            <input type="hidden" {...register('kind')} />
        </InlineForm>
    );
};
