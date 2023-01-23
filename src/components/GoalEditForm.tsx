import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { gql } from '../utils/gql';
import { Goal } from '../../graphql/@generated/genql';

import { GoalForm, GoalFormType } from './GoalForm';

interface GoalEditFormProps {
    goal: Goal;

    onSubmit: (id?: string) => void;
}

const GoalEditForm: React.FC<GoalEditFormProps> = ({ goal, onSubmit }) => {
    const t = useTranslations('goals.edit');

    const updateGoal = async (form: GoalFormType) => {
        const promise = gql.mutation({
            updateGoal: [
                {
                    data: {
                        id: goal.id,
                        title: form.title,
                        description: form.description,
                        ownerId: form.owner.id,
                        parent: form.parent.id,
                        kind: form.parent.kind,
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
            error: t('Something went wrong 😿'),
            loading: t('We are saving your goal'),
            success: t('Voila! Saved successfully 🎉'),
        });

        const res = await promise;

        onSubmit(res.updateGoal?.id);
    };

    // FIXME: https://github.com/taskany-inc/issues/issues/517

    let parent;
    if (goal.project) {
        // @ts-ignore
        parent = { ...goal.project, kind: 'project' };
    }
    if (goal.team) {
        // @ts-ignore
        parent = { ...goal.team, kind: 'team' };
    }

    return (
        <GoalForm
            i18nKeyset="goals.edit"
            formTitle={t('Edit the goal')}
            title={goal.title}
            description={goal.description}
            owner={goal.owner}
            parent={parent}
            state={goal.state}
            priority={goal.priority}
            tags={goal.tags}
            estimate={goal.estimate?.length ? goal.estimate[goal.estimate.length - 1] : undefined}
            onSumbit={updateGoal}
        />
    );
};

export default GoalEditForm;
