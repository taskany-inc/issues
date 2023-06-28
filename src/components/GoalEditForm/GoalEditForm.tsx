import { useState } from 'react';
import { BulbOnIcon, Button } from '@taskany/bricks';
import { gray10 } from '@taskany/colors';

import { GoalForm } from '../GoalForm/GoalForm';
import { GoalUpdateReturnType, GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { useGoalUpdate } from '../../hooks/useGoalUpdate';
import { GoalUpdate, goalUpdateSchema } from '../../schema/goal';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { Tip } from '../Tip';
import { Keyboard } from '../Keyboard';

import { tr } from './GoalEditForm.i18n';

interface GoalEditFormProps {
    goal: NonNullable<GoalByIdReturnType>;

    onSubmit: (goal?: GoalUpdateReturnType) => void;
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
            title={goal.title}
            description={goal.description}
            owner={goal.owner!}
            parent={goal.project!}
            state={goal.state!}
            priority={goal.priority!}
            tags={goal.tags}
            estimate={goal._lastEstimate ?? undefined}
            onSumbit={updateGoal}
            actionButton={
                <>
                    <Button outline text={tr('Cancel')} onClick={dispatchModalEvent(ModalEvent.GoalEditModal)} />
                    <Button view="primary" disabled={busy} outline type="submit" text={tr('Submit')} />
                </>
            }
            tip={
                <Tip title={tr('Pro tip!')} icon={<BulbOnIcon size="s" color={gray10} />}>
                    {tr.raw('Press key to update goal', {
                        key: <Keyboard key={'cmd/enter'} command enter />,
                    })}
                </Tip>
            }
        />
    );
};

export default GoalEditForm;
