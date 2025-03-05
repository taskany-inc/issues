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
import { FormAction } from '../FormActions/FormActions';

import s from './GoalEditForm.module.css';
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
                getGoalActivityFeed: {
                    goalId: goal.id,
                },
                getGoalCommentsFeed: {
                    goalId: goal.id,
                },
            },
            afterInvalidate: dispatchPreviewUpdateEvent,
        },
    );

    const utils = trpc.useContext();

    const updateGoal = async (form: GoalUpdate) => {
        setBusy(true);

        const updatedGoal = await goalUpdate(form);

        onSubmit(updatedGoal);

        utils.v2.project.getAll.invalidate();
        utils.v2.goal.getAllGoals.invalidate();

        if (!updatedGoal) {
            return;
        }

        if (goal._shortId === shortId && updatedGoal._shortId !== goal._shortId) {
            setPreview(updatedGoal._shortId, updatedGoal);
        }

        if (updatedGoal.projectId) {
            utils.v2.project.getProjectGoalsById.invalidate({ id: updatedGoal.projectId });
            utils.v2.project.getById.invalidate({ id: updatedGoal.projectId });
        }

        if (updatedGoal.projectId !== goal.projectId && goal.projectId) {
            utils.v2.project.getProjectGoalsById.invalidate({ id: goal.projectId });
            utils.v2.project.getById.invalidate({ id: goal.projectId });
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
                <FormAction className={s.FormActions}>
                    <Button text={tr('Cancel')} onClick={dispatchModalEvent(ModalEvent.GoalEditModal)} size="m" />
                    <Button
                        view="primary"
                        disabled={busy}
                        type="submit"
                        text={tr('Submit')}
                        size="m"
                        {...goalUpdateButton.attr}
                    />
                </FormAction>
            }
            {...goalForm.attr}
        />
    );
};

export default GoalEditForm;
