import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import z from 'zod';
import useSWR from 'swr';
import styled from 'styled-components';

import { gql } from '../utils/gql';
import { accentIconColor } from '../design/@generated/themes';
import { Flow, UserAnyKind } from '../../graphql/@generated/genql';
import { createFetcher } from '../utils/createFetcher';
import { keyPredictor } from '../utils/keyPredictor';

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
import { FlowCompletion } from './FlowCompletion';
import { UserPic } from './UserPic';
import { ProjectKeyInput } from './ProjectKeyInput';

interface ProjectCreateFormProps {
    card?: boolean;
    onCreate?: (slug?: string) => void;
}

const fetcher = createFetcher(() => ({
    flowRecommended: {
        id: true,
        title: true,
        states: {
            id: true,
            title: true,
        },
    },
}));

const StyledProjectTitleContainer = styled.div`
    position: relative;
`;

const StyledProjectKeyContainer = styled.div`
    position: absolute;
    top: 10px;
    right: 20px;
`;

export const ProjectCreateForm: React.FC<ProjectCreateFormProps> = ({ card, onCreate }) => {
    const { data: session } = useSession();
    const [owner, setOwner] = useState(session?.user as Partial<UserAnyKind>);
    const [flow, setFlow] = useState<Partial<Flow>>();
    const [projectKey, setProjectKey] = useState('');
    const [isKeyByUser, setIsKeyByUser] = useState(false);
    const t = useTranslations('projects.new');
    const { data } = useSWR('flowRecommened', () => fetcher(session?.user));

    useEffect(() => {
        if (data?.flowRecommended) {
            setFlow(data?.flowRecommended[0]);
        }
    }, [data?.flowRecommended]);

    const schema = z.object({
        title: z
            .string({
                required_error: t("Project's title is required"),
                invalid_type_error: t("Project's title must be a string"),
            })
            .min(2, {
                message: t("Project's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
    });

    type FormType = z.infer<typeof schema>;

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isValid, isSubmitted },
    } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
    });

    const projectTitleValue = watch('title');
    useEffect(() => {
        if (!isKeyByUser && projectTitleValue) {
            setProjectKey(keyPredictor(projectTitleValue));
        }
    }, [projectTitleValue, isKeyByUser]);

    const onProjectKeyChange = (k: string) => {
        setIsKeyByUser(true);
        setProjectKey(k);
    };

    const onProjectKeyEdited = (k: string) => {
        if (k === '') {
            setIsKeyByUser(false);
            setProjectKey(keyPredictor(projectTitleValue));
        }
    };

    const createProject = async ({ title, description }: FormType) => {
        if (!session || !owner.id || !flow?.id) return;

        const promise = gql.mutation({
            createProject: [
                {
                    key: projectKey,
                    user: session.user,
                    title,
                    description,
                    ownerId: owner.id,
                    flowId: flow.id,
                },
                {
                    id: true,
                    key: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating new project'),
            success: t('Voila! Project is here 🎉'),
        });

        const res = await promise;

        onCreate && onCreate(res.createProject?.key);
    };

    const ownerButtonText = owner?.name || owner?.email || t('Assign');
    const flowButtonText = flow?.title || t('Flow');

    const formContent = (
        <Form onSubmit={handleSubmit(createProject)}>
            <h2>{t('Create new project')}</h2>

            <StyledProjectTitleContainer>
                <FormInput
                    {...register('title')}
                    error={isSubmitted ? errors.title : undefined}
                    placeholder={t("Project's title")}
                    autoFocus
                    flat="bottom"
                />

                <StyledProjectKeyContainer>
                    <ProjectKeyInput value={projectKey} onChange={onProjectKeyChange} onBlur={onProjectKeyEdited} />
                </StyledProjectKeyContainer>
            </StyledProjectTitleContainer>

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

                    <FlowCompletion
                        disabled
                        size="m"
                        view="outline"
                        text={flowButtonText}
                        placeholder={t('Flow or state title')}
                        query={flow?.title}
                        onClick={(f) => setFlow(f)}
                    />
                </FormAction>
                <FormAction right inline>
                    <Button
                        size="m"
                        view="primary-outline"
                        type="submit"
                        disabled={!isValid}
                        text={t('Create project')}
                    />
                </FormAction>
            </FormActions>
        </Form>
    );

    return (
        <>
            {card ? <FormCard style={{ maxWidth: '800px' }}>{formContent}</FormCard> : formContent}
            <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={accentIconColor} />}>
                {t.rich('Press key to create the project', {
                    key: () => <Keyboard command enter />,
                })}
            </Tip>
        </>
    );
};
