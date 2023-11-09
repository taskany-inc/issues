import { useMemo, useState } from 'react';
import { Button } from '@taskany/bricks';

import { GoalForm } from '../GoalForm/GoalForm';
import { GoalUpdateReturnType, GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { GoalUpdate, goalUpdateSchema } from '../../schema/goal';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { trpc } from '../../utils/trpcClient';
import { useGoalResource } from '../../hooks/useGoalResource';
import { getDateStringFromEstimate } from '../../utils/dateTime';
import { goalForm, goalUpdateButton } from '../../utils/domObjects';
import { dispatchPreviewUpdateEvent } from '../GoalPreview/GoalPreviewProvider';
import RotatableTip from '../RotatableTip/RotatableTip';

import { tr } from './GoalEditForm.i18n';

interface GoalEditFormProps {
    goal: NonNullable<GoalByIdReturnType>;

    onSubmit: (goal?: GoalUpdateReturnType) => void;
}

const GoalEditForm: React.FC<GoalEditFormProps> = ({ goal, onSubmit }) => {
    const [busy, setBusy] = useState(false);
    const { invalidate, goalUpdate } = useGoalResource(
        {
            id: goal.id,
        },
        {
            invalidate: {
                getById: goal._shortId,
            },
            afterInvalidate: dispatchPreviewUpdateEvent,
        },
    );

    const utils = trpc.useContext();

    const updateGoal = async (form: GoalUpdate) => {
        setBusy(true);

        const updatedGoal = await goalUpdate(form);

        onSubmit(updatedGoal);
        utils.project.getDeepInfo.invalidate({ id: form.parent.id });
        await invalidate();
    };

    const estimateValue = useMemo(
        () =>
            goal.estimate
                ? {
                      date: getDateStringFromEstimate(goal.estimate),
                      type: goal.estimateType || 'Strict',
                  }
                : undefined,
        [goal],
    );

    // FIXME: nullable values are conflicting with undefined
    return (
        <GoalForm
            validitySchema={goalUpdateSchema}
            id={goal.id}
            busy={busy}
            title={goal.title}
            description={goal.description}
            owner={goal.owner ?? undefined}
            parent={goal.project ?? undefined}
            state={goal.state ?? undefined}
            priority={goal.priority ?? undefined}
            tags={goal.tags}
            estimate={estimateValue}
            onSubmit={updateGoal}
            actionButton={
                <>
                    <Button outline text={tr('Cancel')} onClick={dispatchModalEvent(ModalEvent.GoalEditModal)} />
                    <Button
                        view="primary"
                        disabled={busy}
                        outline
                        type="submit"
                        text={tr('Submit')}
                        {...goalUpdateButton.attr}
                    />
                </>
            }
            tip={<RotatableTip context="goal" />}
            {...goalForm.attr}
        />
    );
};

export default GoalEditForm;
