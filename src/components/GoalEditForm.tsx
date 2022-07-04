import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { gql } from '../utils/gql';
import { UserAnyKind, Project, State, Tag as TagModel, Goal, EstimateInput } from '../../graphql/@generated/genql';

import { GoalForm, GoalFormType } from './GoalForm';

interface GoalEditFormProps {
    goal: Goal;
    onSubmit: (id?: string) => void;
}

export const GoalEditForm: React.FC<GoalEditFormProps> = ({ goal, onSubmit }) => {
    const t = useTranslations('goals.edit');
    const { data: session } = useSession();
    const [title, setTitle] = useState(goal.title);
    const [description, setDescription] = useState(goal.description);
    const [owner, setOwner] = useState(goal.computedOwner as UserAnyKind);
    const [estimate, setEstimate] = useState<EstimateInput | undefined>(
        goal.estimate?.length ? goal.estimate[goal.estimate.length - 1] : undefined,
    );
    const [project, setProject] = useState(goal.project as Project);
    const [state, setState] = useState(goal.state as State);
    const [tags, setTags] = useState(
        // @ts-ignore
        new Map<string, TagModel>(goal.tags?.map((t) => (t ? [t.id, t] : null)).filter(Boolean)),
    );

    const onTitleChange = useCallback(setTitle, [setTitle]);
    const onDescriptionChange = useCallback(setDescription, [setDescription]);
    const onOwnerChange = useCallback(setOwner, [setOwner]);
    const onProjectChange = useCallback(setProject, [setProject]);
    const onStateChange = useCallback(setState, [setState]);
    const onEstimateChange = useCallback(setEstimate, [setEstimate]);
    const onTagAdd = useCallback(
        (tag: TagModel) => {
            const newTags = new Map(tags);
            newTags.set(tag.id, tag);
            setTags(newTags);
        },
        [tags],
    );
    const onTagDelete = useCallback(
        (tag: TagModel) => () => {
            const newTags = new Map(tags);
            newTags.delete(tag.id);
            setTags(newTags);
        },
        [tags],
    );

    useEffect(() => {
        const defaultState = project?.flow?.states?.filter((s) => s?.default)[0];
        if (defaultState) {
            setState(defaultState);
        }
    }, [project]);

    const updateGoal = async ({ title, description }: GoalFormType) => {
        if (!session || !owner.id || !project?.id) return;

        const promise = gql.mutation({
            updateGoal: [
                {
                    goal: {
                        id: goal.id,
                        title,
                        description,
                        ownerId: owner.activity?.id,
                        projectId: project.id,
                        estimate,
                        stateId: state?.id,
                        tags: Array.from(tags.values()),
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

    return (
        <GoalForm
            i18nKeyset="goals.edit"
            formTitle={t('Edit the goal')}
            title={title}
            description={description}
            owner={owner}
            project={project}
            state={state}
            tags={tags}
            estimate={estimate}
            onSumbit={updateGoal}
            onTitleChange={onTitleChange}
            onDescriptionChange={onDescriptionChange}
            onOwnerChange={onOwnerChange}
            onProjectChange={onProjectChange}
            onEstimateChange={onEstimateChange}
            onStateChange={onStateChange}
            onTagAdd={onTagAdd}
            onTagDelete={onTagDelete}
        />
    );
};
