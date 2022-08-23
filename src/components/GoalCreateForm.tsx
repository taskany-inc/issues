import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import styled from 'styled-components';

import { gql } from '../utils/gql';
import { gapS, gray6, star0 } from '../design/@generated/themes';
import { UserAnyKind, Project, EstimateInput, State, Tag as TagModel } from '../../graphql/@generated/genql';
import { routes } from '../hooks/router';
import { TLocale } from '../types/locale';

import { Icon } from './Icon';
import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { GoalForm, GoalFormType } from './GoalForm';
import { Link } from './Link';

interface GoalCreateFormProps {
    locale: TLocale;

    onCreate: (id?: string) => void;
}

const StyledFormBottom = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    padding: ${gapS} ${gapS} 0 ${gapS};
`;

const GoalCreateForm: React.FC<GoalCreateFormProps> = ({ locale, onCreate }) => {
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
        if (!owner.id || !project?.id) return;

        const promise = gql.mutation({
            createGoal: [
                {
                    goal: {
                        title,
                        description,
                        ownerId: owner.id,
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
            loading: t('We are creating new goal'),
            success: t('Voila! Goal is here 🎉'),
        });

        const res = await promise;

        onCreate(res.createGoal?.id);
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
            <StyledFormBottom>
                <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={star0} />}>
                    {t.rich('Press key to create the goal', {
                        key: () => <Keyboard command enter />,
                    })}
                </Tip>

                <Link href={routes.help(locale, 'goals')}>
                    <Icon type="question" size="s" color={gray6} />
                </Link>
            </StyledFormBottom>
        </GoalForm>
    );
};

export default GoalCreateForm;
