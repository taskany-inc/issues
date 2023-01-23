import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useSWR from 'swr';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

import { gapS, gray6, star0 } from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { keyPredictor } from '../utils/keyPredictor';
import { nullable } from '../utils/nullable';
import { submitKeys } from '../utils/hotkeys';
import { errorsProvider } from '../utils/forms';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import { routes, useRouter } from '../hooks/router';
import { usePageContext } from '../hooks/usePageContext';
import { CreateProjectFormType, createProjectSchemaProvider, useProjectResource } from '../hooks/useProjectResource';

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
import { InputContainer } from './InputContaier';

const KeyInput = dynamic(() => import('./KeyInput'));

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
    display: flex;
    position: relative;
`;

const StyledProjectKeyContainer = styled.div`
    position: relative;
`;

const StyledFormBottom = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    padding: ${gapS} ${gapS} 0 ${gapS};
`;

const StyledProjectKeyInputContainer = styled(InputContainer)`
    box-sizing: border-box;
    width: fit-content;
    padding-right: ${gapS};
`;

const ProjectCreateForm: React.FC = () => {
    const t = useTranslations('projects');
    const router = useRouter();
    const { locale, user } = usePageContext();
    const { createProject } = useProjectResource(0);
    const [focusedInput, setFocusedInput] = useState(false);
    const [hoveredInput, setHoveredInput] = useState(false);

    const schema = createProjectSchemaProvider(t);

    const {
        register,
        handleSubmit,
        watch,
        setFocus,
        setValue,
        control,
        formState: { errors, isValid, isSubmitted },
    } = useForm<CreateProjectFormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: false,
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

    const { data: flowData } = useSWR('flow', () => flowFetcher(user));
    const { data: projectData } = useSWR(keyWatcher && keyWatcher !== '' ? [user, keyWatcher] : null, projectFetcher);

    useEffect(() => {
        if (flowData?.flowRecommended) {
            setValue('flow', flowData?.flowRecommended[0]);
        }
    }, [setValue, flowData?.flowRecommended]);

    const onCreateProject = useCallback(
        (key: string) => {
            router.project(key);
        },
        [router],
    );

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
                <FormTitle>{t('create.Create new project')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={handleSubmit(createProject(onCreateProject, t))} submitHotkey={submitKeys}>
                    <StyledProjectTitleContainer>
                        <FormInput
                            {...register('title')}
                            placeholder={t("create.Project's title")}
                            flat="bottom"
                            brick="right"
                            error={errorsResolver('title')}
                            onMouseEnter={() => setHoveredInput(true)}
                            onMouseLeave={() => setHoveredInput(false)}
                            onFocus={() => setFocusedInput(true)}
                            onBlur={() => setFocusedInput(false)}
                        />

                        {nullable(titleWatcher, () => (
                            <StyledProjectKeyContainer>
                                <Controller
                                    name="key"
                                    control={control}
                                    render={({ field }) => (
                                        <StyledProjectKeyInputContainer
                                            brick="left"
                                            hovered={hoveredInput}
                                            focused={focusedInput}
                                        >
                                            <KeyInput
                                                available={isProjectKeyAvailable}
                                                tooltip={
                                                    isProjectKeyAvailable
                                                        ? t.rich(
                                                              'create.Perfect! Issues in your project will look like',
                                                              richProps,
                                                          )
                                                        : t.rich('create.Project with key already exists', richProps)
                                                }
                                                {...field}
                                            />
                                        </StyledProjectKeyInputContainer>
                                    )}
                                />
                            </StyledProjectKeyContainer>
                        ))}
                    </StyledProjectTitleContainer>

                    <FormTextarea
                        {...register('description')}
                        placeholder={t('create.And its description')}
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
                                        text={t('create.Flow')}
                                        placeholder={t('create.Flow or state title')}
                                        error={errorsResolver(field.name)}
                                        {...field}
                                    />
                                )}
                            />
                        </FormAction>
                        <FormAction right inline>
                            <Button view="primary" outline={!isValid} type="submit" text={t('create.Create project')} />
                        </FormAction>
                    </FormActions>
                </Form>

                <StyledFormBottom>
                    <Tip title={t('create.Pro tip!')} icon={<Icon type="bulbOn" size="s" color={star0} />}>
                        {t.rich('create.Press key to create the project', {
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
