import { useState } from 'react';
import { FormAction, Button } from '@taskany/bricks';

import { GoalForm } from '../GoalForm/GoalForm';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { useGoalUpdate } from '../../hooks/useGoalUpdate';
import { GoalUpdate, goalUpdateSchema } from '../../schema/goal';

import { tr } from './GoalEditForm.i18n';

interface GoalEditFormProps {
    goal: NonNullable<GoalByIdReturnType>;

    onSubmit: (goal?: GoalByIdReturnType) => void;
}

const GoalEditForm: React.FC<GoalEditFormProps> = ({ goal, onSubmit }) => {
    const [busy, setBusy] = useState(false);
    const update = useGoalUpdate(goal.id);

    const updateGoal = async (form: GoalUpdate) => {
        setBusy(true);

        const updatedGoal = await update(form);

        onSubmit(updatedGoal);
    };

    // FIXME: nullable values are conflicting with undefined
    return (
        <GoalForm
            validityScheme={goalUpdateSchema}
            id={goal.id}
            busy={busy}
            formTitle={tr('Edit the goal')}
            title={goal.title}
            description={goal.description}
            owner={goal.owner!}
            parent={goal.project!}
            state={goal.state!}
            priority={goal.priority!}
            tags={goal.tags}
            estimate={goal._lastEstimate ?? undefined}
            onSumbit={updateGoal}
            renderActionButton={({ busy, isValid }) => (
                <FormAction right inline>
                    <Button view="primary" disabled={busy} outline={!isValid} type="submit" text={tr('Submit')} />
                </FormAction>
            )}
        />
    );
};

export default GoalEditForm;
