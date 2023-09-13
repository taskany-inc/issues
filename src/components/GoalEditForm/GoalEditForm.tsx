import { useState } from 'react';
import { Button } from '@taskany/bricks';
import { gray10 } from '@taskany/colors';
import { IconBulbOnOutline } from '@taskany/icons';

import { GoalForm } from '../GoalForm/GoalForm';
import { GoalUpdateReturnType, GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { useGoalUpdate } from '../../hooks/useGoalUpdate';
import { GoalUpdate, goalUpdateSchema } from '../../schema/goal';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { Tip } from '../Tip';
import { Keyboard } from '../Keyboard';
import { useLocale } from '../../hooks/useLocale';
import { parseLocaleDate } from '../../utils/dateTime';
import { trpc } from '../../utils/trpcClient';

import { tr } from './GoalEditForm.i18n';

interface GoalEditFormProps {
    goal: NonNullable<GoalByIdReturnType>;

    onSubmit: (goal?: GoalUpdateReturnType) => void;
}

const GoalEditForm: React.FC<GoalEditFormProps> = ({ goal, onSubmit }) => {
    const locale = useLocale();
    const [busy, setBusy] = useState(false);
    const update = useGoalUpdate(goal.id);

    const utils = trpc.useContext();

    const updateGoal = async (form: GoalUpdate) => {
        setBusy(true);

        if (form.estimate && form.estimate.date) {
            form.estimate.date = parseLocaleDate(form.estimate?.date, { locale }).toISOString();
        }

        const updatedGoal = await update(form);

        onSubmit(updatedGoal);
        utils.project.getDeepInfo.invalidate({ id: form.parent.id });
    };

    // FIXME: nullable values are conflicting with undefined
    return (
        <GoalForm
            validityScheme={goalUpdateSchema}
            id={goal.id}
            busy={busy}
            title={goal.title}
            description={goal.description}
            owner={goal.owner ?? undefined}
            parent={goal.project ?? undefined}
            state={goal.state ?? undefined}
            priority={goal.priority ?? undefined}
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
                <Tip title={tr('Pro tip!')} icon={<IconBulbOnOutline size="s" color={gray10} />}>
                    {tr.raw('Press key to update goal', {
                        key: <Keyboard key={'cmd/enter'} command enter />,
                    })}
                </Tip>
            }
        />
    );
};

export default GoalEditForm;
