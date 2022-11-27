import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import z from 'zod';
import useSWR from 'swr';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

import { gapS, gray6, star0 } from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { keyPredictor } from '../utils/keyPredictor';
import { nullable } from '../utils/nullable';
import { gql } from '../utils/gql';
import { submitKeys } from '../utils/hotkeys';
import { errorsProvider } from '../utils/forms';
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
import { FormTitle } from './FormTitle';
import { Text } from './Text';
import { Link } from './Link';
import { FlowComboBox } from './FlowComboBox';
import { ModalContent, ModalHeader } from './Modal';

// const UserCompletionDropdown = dynamic(() => import('./UserComboBox'));
const ProjectKeyInput = dynamic(() => import('./ProjectKeyInput'));

interface ProjectCreateFormProps {
    locale: TLocale;

    onCreate?: (slug?: string) => void;
}

const flowFetcher = createFetcher(() => ({
    flowRecommended: {
        id: true,
        title: true,
        states: {
            id: true,
            title: true,
        },
    },
}));
const projectFetcher = createFetcher((_, key: string) => ({
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

const schemaProvider = (t: (key: string) => string) =>
    z.object({
        title: z
            .string({
                required_error: t("Project's title is required"),
                invalid_type_error: t("Project's title must be a string"),
            })
            .min(2, {
                message: t("Project's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
        flow: z.object({
            id: z.string(),
        }),
        key: z.string().min(3),
    });

export type ProjectFormType = z.infer<ReturnType<typeof schemaProvider>>;

const ProjectCreateForm: React.FC<ProjectCreateFormProps> = ({ locale, onCreate }) => {
    const { data: session } = useSession();
    const t = useTranslations('projects.new');

    const schema = schemaProvider(t);

    const {
        register,
        handleSubmit,
        watch,
        setFocus,
        setValue,
        control,
        formState: { errors, isValid, isSubmitted },
    } = useForm<ProjectFormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
    });

    useEffect(() => {
        setTimeout(() => setFocus('title'), 0);
    }, [setFocus]);

    const errorsResolver = errorsProvider(errors, isSubmitted);
    const titleWatcher = watch('title');
    const keyWatcher = watch('key');

    useDebouncedEffect(
        () => {
            setValue('key', titleWatcher && titleWatcher !== '' ? keyPredictor(titleWatcher) : '');
        },
        300,
        [setValue, titleWatcher],
    );

    const { data: flowData } = useSWR([session?.user], (...args) => flowFetcher(...args));
    const { data: projectData } = useSWR(
        keyWatcher && keyWatcher !== '' ? [session?.user, keyWatcher] : null,
        (...args) => projectFetcher(...args),
    );

    useEffect(() => {
        if (flowData?.flowRecommended) {
            setValue('flow', flowData?.flowRecommended[0]);
        }
    }, [setValue, flowData?.flowRecommended]);

    const createProject = async (form: ProjectFormType) => {
        const promise = gql.mutation({
            createProject: [
                {
                    data: {
                        key: form.key,
                        title: form.title,
                        description: form.description,
                        flowId: form.flow.id,
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

    const isProjectKeyAvailable = Boolean(projectData?.project === null || !projectData);
    const richProps = {
        b: (c: React.ReactNode) => (
            <Text as="span" size="s" weight="bolder">
                {c}
            </Text>
        ),
        key: () => keyWatcher,
    };

    return (
        <>
            <ModalHeader>
                <FormTitle>{t('Create new project')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={handleSubmit(createProject)} submitHotkey={submitKeys}>
                    <StyledProjectTitleContainer>
                        <FormInput
                            {...register('title')}
                            placeholder={t("Project's title")}
                            flat="bottom"
                            error={errorsResolver('title')}
                        />

                        {nullable(titleWatcher, () => (
                            <StyledProjectKeyContainer>
                                <Controller
                                    name="key"
                                    control={control}
                                    render={({ field }) => (
                                        <ProjectKeyInput
                                            available={isProjectKeyAvailable}
                                            tooltip={
                                                isProjectKeyAvailable
                                                    ? t.rich(
                                                          'Perfect! Issues in your project will looks like',
                                                          richProps,
                                                      )
                                                    : t.rich('Project with key already exists', richProps)
                                            }
                                            {...field}
                                        />
                                    )}
                                />
                            </StyledProjectKeyContainer>
                        ))}
                    </StyledProjectTitleContainer>

                    <FormTextarea
                        {...register('description')}
                        placeholder={t('And its description')}
                        flat="both"
                        error={errorsResolver('description')}
                    />

                    <FormActions flat="top">
                        <FormAction left inline>
                            <Controller
                                name="flow"
                                control={control}
                                render={({ field }) => (
                                    <FlowComboBox
                                        disabled
                                        text={t('Flow')}
                                        placeholder={t('Flow or state title')}
                                        error={errorsResolver(field.name)}
                                        {...field}
                                    />
                                )}
                            />
                        </FormAction>
                        <FormAction right inline>
                            <Button view="primary" outline={!isValid} type="submit" text={t('Create project')} />
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
            </ModalContent>
        </>
    );
};

export default ProjectCreateForm;
