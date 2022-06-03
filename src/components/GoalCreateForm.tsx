import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import z from 'zod';

import { gql } from '../utils/gql';
import { estimatedMeta } from '../utils/dateTime';
import { accentIconColor } from '../design/@generated/themes';
import { UserAnyKind, Project, GoalEstimate, State, Tag as TagModel } from '../../graphql/@generated/genql';

import { FormCard } from './FormCard';
import { Icon } from './Icon';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { FormTextarea } from './FormTextarea';
import { FormActions, FormAction } from './FormActions';
import { Form } from './Form';
import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { UserCompletion } from './UserCompletion';
import { ProjectCompletion } from './ProjectCompletion';
import { TagCompletion } from './TagCompletion';
import { EstimateDropdown } from './EstimateDropdown';
import { StateDropdown } from './StateDropdown';
import { UserPic } from './UserPic';
import { Tag } from './Tag';

interface GoalCreateFormProps {
    card?: boolean;
    onCreate?: (id?: string) => void;
}

const StyledTagsContainer = styled.div`
    padding-left: 12px;
`;

export const GoalCreateForm: React.FC<GoalCreateFormProps> = ({ card, onCreate }) => {
    const { data: session } = useSession();
    const [owner, setOwner] = useState(session?.user as Partial<UserAnyKind>);
    const [estimate, setEstimate] = useState<GoalEstimate>();
    const [project, setProject] = useState<Project>();
    const [state, setState] = useState<State>();
    const [tags, setTags] = useState(new Map<string, TagModel>());
    const addTagToState = (tag: TagModel) => {
        const newTags = new Map(tags);
        newTags.set(tag.id, tag);
        setTags(newTags);
    };

    useEffect(() => {
        const defaultState = project?.flow?.states?.filter((s) => s?.default)[0];
        if (defaultState) {
            setState(defaultState);
        }
    }, [project]);

    const removeTagFromState = (tag: TagModel) => {
        const newTags = new Map(tags);
        newTags.delete(tag.id);
        setTags(newTags);
    };
    const t = useTranslations('goals.new');

    const schema = z.object({
        title: z
            .string({
                required_error: t("Goal's title is required"),
                invalid_type_error: t("Goal's title must be a string"),
            })
            .min(10, {
                message: t("Goal's title must be longer than 10 symbols"),
            }),
        description: z
            .string({
                required_error: t("Goal's description is required"),
                invalid_type_error: t("Goal's description must be a string"),
            })
            .min(10, {
                message: t("Goal's description must be longer than 10 symbols"),
            }),
    });

    type FormType = z.infer<typeof schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitted },
    } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
    });

    const createGoal = async ({ title, description }: FormType) => {
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

        onCreate && onCreate(String(res.createGoal?.id));
    };

    const ownerButtonText = owner?.name || owner?.email || t('Assign');
    const projectButtonText = project?.title || t('Enter project title');
    const stateButtonText = state?.title || t('State');
    const estimateDefault = estimatedMeta();

    const formContent = (
        <Form onSubmit={handleSubmit(createGoal)}>
            <ProjectCompletion
                text={projectButtonText}
                placeholder={t('Enter project title')}
                query={project?.title}
                onClick={(p) => setProject(p)}
            />

            <h2>{t('Create new goal')}</h2>

            <FormInput
                {...register('title')}
                error={isSubmitted ? errors.title : undefined}
                placeholder={t("Goal's title")}
                autoFocus
                flat="bottom"
            />
            <FormTextarea
                {...register('description')}
                error={isSubmitted ? errors.description : undefined}
                flat="both"
                placeholder={t('And its description')}
            />
            <FormActions flat="top">
                <FormAction left inline>
                    <UserCompletion
                        size="m"
                        view="outline"
                        text={ownerButtonText}
                        placeholder={t('Enter name or email')}
                        query={owner?.name || owner?.email}
                        userPic={<UserPic src={owner?.image} size={16} />}
                        onClick={(u) => setOwner(u)}
                    />

                    <StateDropdown
                        size="m"
                        view="outline"
                        text={stateButtonText}
                        flowId={project?.flow?.id}
                        onClick={(s) => setState(s)}
                    />

                    <EstimateDropdown
                        size="m"
                        view="outline"
                        text={t('Schedule')}
                        placeholder={t('Date input mask placeholder')}
                        mask={t('Date input mask')}
                        defaultValuePlaceholder={estimateDefault}
                        onChange={(e) => setEstimate(e)}
                    />

                    <TagCompletion
                        filter={Array.from(tags.keys())}
                        placeholder={t('Enter tag title')}
                        onClick={(tag) => addTagToState(tag)}
                    />

                    <StyledTagsContainer>
                        {Array.from(tags.values()).map((tag) => (
                            <Tag
                                key={tag.id}
                                title={tag.title}
                                description={tag.description}
                                onHide={() => removeTagFromState(tag)}
                            />
                        ))}
                    </StyledTagsContainer>
                </FormAction>
                <FormAction right inline>
                    <Button size="m" view="primary-outline" type="submit" disabled={!isValid} text={t('Create goal')} />
                </FormAction>
            </FormActions>
        </Form>
    );

    return (
        <>
            {card ? <FormCard style={{ maxWidth: '800px' }}>{formContent}</FormCard> : formContent}
            <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={accentIconColor} />}>
                {t.rich('Press key to create the goal', {
                    key: () => <Keyboard command enter />,
                })}
            </Tip>
        </>
    );
};
