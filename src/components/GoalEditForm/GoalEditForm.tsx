import { useMemo, useState } from 'react';
import { Button } from '@taskany/bricks/harmony';

import { GoalForm } from '../GoalForm/GoalForm';
import { GoalUpdateReturnType, GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { GoalUpdate, goalUpdateSchema } from '../../schema/goal';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { trpc } from '../../utils/trpcClient';
import { useGoalResource } from '../../hooks/useGoalResource';
import { getDateStringFromEstimate } from '../../utils/dateTime';
import { goalForm, goalUpdateButton } from '../../utils/domObjects';
import { dispatchPreviewUpdateEvent, useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import RotatableTip from '../RotatableTip/RotatableTip';

import { tr } from './GoalEditForm.i18n';

interface GoalEditFormProps {
    goal: NonNullable<GoalByIdReturnType>;

    onSubmit: (goal?: GoalUpdateReturnType) => void;
}

const GoalEditForm: React.FC<GoalEditFormProps> = ({ goal, onSubmit }) => {
    const { setPreview, shortId } = useGoalPreview();
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

        utils.project.getAll.invalidate();
        utils.goal.getBatch.invalidate();
        utils.project.getUserProjectsWithGoals.invalidate();

        if (!updatedGoal) {
            return;
        }

        if (goal._shortId === shortId && updatedGoal._shortId !== goal._shortId) {
            setPreview(updatedGoal._shortId, updatedGoal);
        }

        if (updatedGoal.projectId) {
            utils.project.getDeepInfo.invalidate({ id: updatedGoal.projectId });
            utils.project.getById.invalidate({ id: updatedGoal.projectId });
        }

        if (updatedGoal.projectId !== goal.projectId && goal.projectId) {
            utils.project.getDeepInfo.invalidate({ id: goal.projectId });
            utils.project.getById.invalidate({ id: goal.projectId });
        }

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
                    <Button text={tr('Cancel')} onClick={dispatchModalEvent(ModalEvent.GoalEditModal)} />
                    <Button
                        view="primary"
                        disabled={busy}
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
