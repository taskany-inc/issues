import { useState } from 'react';
import toast from 'react-hot-toast';

import { gql } from '../../utils/gql';
import { Goal } from '../../../graphql/@generated/genql';
import { GoalForm, GoalFormType } from '../GoalForm/GoalForm';

import { tr } from './GoalEditForm.i18n';

interface GoalEditFormProps {
    goal: Goal;

    onSubmit: (id?: string) => void;
}

const GoalEditForm: React.FC<GoalEditFormProps> = ({ goal, onSubmit }) => {
    const [busy, setBusy] = useState(false);

    const updateGoal = async (form: GoalFormType) => {
        setBusy(true);

        const promise = gql.mutation({
            updateGoal: [
                {
                    data: {
                        id: goal.id,
                        title: form.title,
                        description: form.description,
                        ownerId: form.owner.id,
                        projectId: form.parent.id,
                        stateId: form.state.id,
                        priority: form.priority,
                        tags: form.tags,
                        estimate: form.estimate,
                    },
                },
                {
                    id: true,
                },
            ],
        });

        toast.promise(promise, {
            error: tr('Something went wrong 😿'),
            loading: tr('We are saving your goal'),
            success: tr('Voila! Saved successfully 🎉'),
        });

        const res = await promise;

        onSubmit(res.updateGoal?.id);
    };

    return (
        <GoalForm
            busy={busy}
            formTitle={tr('Edit the goal')}
            title={goal.title}
            description={goal.description}
            owner={goal.owner}
            parent={goal.project}
            state={goal.state}
            priority={goal.priority}
            tags={goal.tags}
            estimate={goal.estimate?.length ? goal.estimate[goal.estimate.length - 1] : undefined}
            onSumbit={updateGoal}
            actionBtnText={tr('Submit')}
        />
    );
};

export default GoalEditForm;
