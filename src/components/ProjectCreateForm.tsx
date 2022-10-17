import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import z from 'zod';
import useSWR from 'swr';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

import { gapS, gray6, star0 } from '../design/@generated/themes';
import { Flow, UserAnyKind } from '../../graphql/@generated/genql';
import { createFetcher } from '../utils/createFetcher';
import { keyPredictor } from '../utils/keyPredictor';
import { nullable } from '../utils/nullable';
import { gql } from '../utils/gql';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import { TLocale } from '../types/locale';
import { routes } from '../hooks/router';

import { Icon } from './Icon';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { FormTextarea } from './FormTextarea';
import { FormActions, FormAction } from './FormActions';
import { Form } from './Form';
import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { UserPic } from './UserPic';
import { FormTitle } from './FormTitle';
import { Text } from './Text';
import { Link } from './Link';

const UserCompletionDropdown = dynamic(() => import('./UserCompletionDropdown'));
const FlowCompletion = dynamic(() => import('./FlowCompletion'));
const ProjectKeyInput = dynamic(() => import('./ProjectKeyInput'));

interface ProjectCreateFormProps {
    locale: TLocale;

    onCreate?: (slug?: string) => void;
}

const fetcher = createFetcher((_, key: string) => ({
    flowRecommended: {
        id: true,
        title: true,
        states: {
            id: true,
            title: true,
        },
    },
    project: [
        {
            key,
        },
        {
            title: true,
        },
    ],
}));

const StyledProjectTitleContainer = styled.div`
    position: relative;
`;

const StyledProjectKeyContainer = styled.div`
    position: absolute;
    top: 6px;
    right: ${gapS};
`;

const StyledFormBottom = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    padding: ${gapS} ${gapS} 0 ${gapS};
`;

const defaultIndexesFlow = [0, -1, 0, 1, 2, 3];
const backIndexesFlow = [1, 2, 3, 4, 5, 6];

const ProjectCreateForm: React.FC<ProjectCreateFormProps> = ({ locale, onCreate }) => {
    const { data: session } = useSession();
    const [owner, setOwner] = useState(session?.user as Partial<UserAnyKind>);
    const [flow, setFlow] = useState<Partial<Flow>>();
    const [projectKey, setProjectKey] = useState('');
    const [isKeyByUser, setIsKeyByUser] = useState(false);
    const [indexes, setIndexes] = useState(defaultIndexesFlow);
    const t = useTranslations('projects.new');
    const { data } = useSWR([session?.user, projectKey], (...args) => fetcher(...args));

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
        setFocus,
        formState: { errors, isValid, isSubmitted },
    } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
    });

    const projectTitleValue = watch('title');
    useDebouncedEffect(
        () => {
            if (!isKeyByUser && projectTitleValue) {
                setProjectKey(keyPredictor(projectTitleValue));
            }

            if (projectTitleValue === '') {
                setProjectKey('');
            }
        },
        500,
        [projectTitleValue, isKeyByUser],
    );

    useEffect(() => {
        setTimeout(() => setFocus('title'), 0);
    }, [setFocus]);

    const onInputFocus = useCallback(() => {
        setIndexes(defaultIndexesFlow);
    }, []);

    const onTextareaFocus = useCallback(() => {
        setIndexes(backIndexesFlow);
    }, []);

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
                    data: {
                        key: projectKey,
                        title,
                        description,
                        flowId: flow.id,
                    },
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
    const isProjectKeyAvailable = Boolean(data?.project === null);
    const richProps = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        b: (c: any) => (
            <Text as="span" size="s" weight="bolder">
                {c}
            </Text>
        ),
        key: () => projectKey,
    };

    return (
        <>
            <FormTitle>{t('Create new project')}</FormTitle>

            <Form onSubmit={handleSubmit(createProject)}>
                <StyledProjectTitleContainer>
                    <FormInput
                        {...register('title')}
                        placeholder={t("Project's title")}
                        flat="bottom"
                        tabIndex={indexes[0]}
                        error={isSubmitted ? errors.title : undefined}
                        onFocus={onInputFocus}
                    />

                    {nullable(isValid && projectKey, () => (
                        <StyledProjectKeyContainer>
                            <ProjectKeyInput
                                value={projectKey}
                                onChange={onProjectKeyChange}
                                onBlur={onProjectKeyEdited}
                                available={isProjectKeyAvailable}
                                tooltip={
                                    isProjectKeyAvailable
                                        ? t.rich('Perfect! Issues in your project will looks like', richProps)
                                        : t.rich('Project with key already exists', richProps)
                                }
                                tabIndex={indexes[1]}
                            />
                        </StyledProjectKeyContainer>
                    ))}
                </StyledProjectTitleContainer>

                <FormTextarea
                    {...register('description')}
                    placeholder={t('And its description')}
                    flat="both"
                    tabIndex={indexes[2]}
                    error={isSubmitted ? errors.description : undefined}
                    onFocus={onTextareaFocus}
                />

                <FormActions flat="top">
                    <FormAction left inline>
                        <UserCompletionDropdown
                            size="m"
                            text={ownerButtonText}
                            placeholder={t('Enter name or email')}
                            query={owner?.name || owner?.email}
                            userPic={<UserPic src={owner?.image} size={16} />}
                            onClick={(u) => setOwner(u)}
                            tabIndex={indexes[3]}
                        />

                        <FlowCompletion
                            disabled
                            size="m"
                            text={flowButtonText}
                            placeholder={t('Flow or state title')}
                            query={flow?.title}
                            onClick={(f) => setFlow(f)}
                            tabIndex={indexes[4]}
                        />
                    </FormAction>
                    <FormAction right inline>
                        <Button
                            size="m"
                            view="primary"
                            type="submit"
                            disabled={!(isValid && isProjectKeyAvailable)}
                            text={t('Create project')}
                            tabIndex={indexes[5]}
                        />
                    </FormAction>
                </FormActions>
            </Form>

            <StyledFormBottom>
                <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={star0} />}>
                    {t.rich('Press key to create the project', {
                        key: () => <Keyboard command enter />,
                    })}
                </Tip>

                <Link href={routes.help(locale, 'projects')}>
                    <Icon type="question" size="s" color={gray6} />
                </Link>
            </StyledFormBottom>
        </>
    );
};

export default ProjectCreateForm;
