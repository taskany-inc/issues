import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { gql } from '../utils/gql';
import { star0 } from '../design/@generated/themes';
import { UserAnyKind, Project, EstimateInput, State, Tag as TagModel } from '../../graphql/@generated/genql';

import { Icon } from './Icon';
import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { GoalForm, GoalFormType } from './GoalForm';

interface GoalCreateFormProps {
    onSubmit: (id?: string) => void;
}

export const GoalCreateForm: React.FC<GoalCreateFormProps> = ({ onSubmit }) => {
    const t = useTranslations('goals.new');
    const { data: session } = useSession();
    const [owner, setOwner] = useState(session?.user as Partial<UserAnyKind>);
    const [estimate, setEstimate] = useState<EstimateInput>();
    const [project, setProject] = useState<Project>();
    const [state, setState] = useState<State>();
    const [tags, setTags] = useState(new Map<string, TagModel>());

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

    const createGoal = async ({ title, description }: GoalFormType) => {
        if (!session || !owner.id || !project?.id) return;

        const promise = gql.mutation({
            createGoal: [
                {
                    user: session.user,
                    title,
                    description,
                    ownerId: owner.id,
                    projectId: project.id,
                    estimate,
                    stateId: state?.id,
                    tags: Array.from(tags.keys()),
                },
                {
                    id: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating new goal'),
            success: t('Voila! Goal is here 🎉'),
        });

        const res = await promise;

        onSubmit(res.createGoal?.id);
    };

    return (
        <GoalForm
            i18nKeyset="goals.new"
            formTitle={t('Create new goal')}
            owner={owner}
            project={project}
            state={state}
            tags={tags}
            estimate={estimate}
            onSumbit={createGoal}
            onOwnerChange={onOwnerChange}
            onProjectChange={onProjectChange}
            onEstimateChange={onEstimateChange}
            onStateChange={onStateChange}
            onTagAdd={onTagAdd}
            onTagDelete={onTagDelete}
        >
            <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={star0} />}>
                {t.rich('Press key to create the goal', {
                    key: () => <Keyboard command enter />,
                })}
            </Tip>
        </GoalForm>
    );
};
