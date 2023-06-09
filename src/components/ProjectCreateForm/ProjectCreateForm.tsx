import React, { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { gapS, gray10, gray9 } from '@taskany/colors';
import {
    Button,
    Text,
    InputContainer,
    Link,
    Form,
    FormActions,
    FormAction,
    FormTextarea,
    FormInput,
    BulbOnIcon,
    QuestionIcon,
    ModalContent,
    nullable,
} from '@taskany/bricks';

import { keyPredictor } from '../../utils/keyPredictor';
import { errorsProvider } from '../../utils/forms';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import { routes, useRouter } from '../../hooks/router';
import { usePageContext } from '../../hooks/usePageContext';
import { useProjectResource } from '../../hooks/useProjectResource';
import { Tip } from '../Tip';
import { Keyboard } from '../Keyboard';
import { FlowComboBox } from '../FlowComboBox';
import { trpc } from '../../utils/trpcClient';
import { ProjectCreate, projectCreateSchema } from '../../schema/project';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';

import { tr } from './ProjectCreateForm.i18n';

const KeyInput = dynamic(() => import('../KeyInput'));

const StyledProjectTitleContainer = styled.div`
    display: flex;
    position: relative;
`;

const StyledProjectKeyContainer = styled.div`
    position: relative;
`;

const StyledProjectKeyInputContainer = styled(InputContainer)`
    box-sizing: border-box;
    width: fit-content;
    padding-right: ${gapS};
`;

const StyledHelpIcon = styled(QuestionIcon)`
    display: flex;
    align-items: center;
`;

const ProjectCreateForm: React.FC = () => {
    const router = useRouter();
    const { locale } = usePageContext();
    const { createProject } = useProjectResource('');
    const [focusedInput, setFocusedInput] = useState(false);
    const [hoveredInput, setHoveredInput] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dirtyKey, setDirtyKey] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setFocus,
        setValue,
        control,
        formState: { errors, isValid, isSubmitted },
    } = useForm<ProjectCreate>({
        resolver: zodResolver(projectCreateSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: false,
    });

    useEffect(() => {
        setTimeout(() => setFocus('title'), 0);
    }, [setFocus]);

    const errorsResolver = errorsProvider(errors, isSubmitted);
    const titleWatcher = watch('title');
    const keyWatcher = watch('id');

    useDebouncedEffect(
        () => {
            if (!dirtyKey && titleWatcher && titleWatcher !== '') {
                setValue('id', keyPredictor(titleWatcher));
            }
        },
        300,
        [setValue, titleWatcher],
    );

    const isKeyEnoughLength = Boolean(keyWatcher?.length >= 3);
    const flowRecomendations = trpc.flow.recommedations.useQuery();
    const existingProject = trpc.project.getById.useQuery(keyWatcher, {
        enabled: isKeyEnoughLength,
    });

    const isKeyUnique = Boolean(!existingProject?.data);

    useEffect(() => {
        if (flowRecomendations.data) {
            setValue('flow', flowRecomendations.data[0]);
        }
    }, [setValue, flowRecomendations]);

    const onCreateProject = useCallback(
        (form: ProjectCreate) => {
            setBusy(true);

            // FIXME: it not looks like the best API
            createProject((id: string) => {
                router.project(id);
                dispatchModalEvent(ModalEvent.ProjectCreateModal)();
            })(form);
        },
        [router, createProject],
    );

    const onKeyDirty = useCallback(() => {
        setDirtyKey(true);
    }, []);

    // eslint-disable-next-line no-nested-ternary
    const tooltip = isKeyEnoughLength
        ? isKeyUnique
            ? tr.raw('Perfect! Issues and goals will look like', {
                  perfect: (
                      <Text as="span" size="s" weight="bolder">
                          {tr('Perfect')}
                      </Text>
                  ),
                  issueKeyOne: (
                      <Text as="span" size="s" weight="bolder">
                          {tr.raw('issue key one', {
                              key: keyWatcher,
                          })}
                      </Text>
                  ),
                  issueKeyTwo: (
                      <Text as="span" size="s" weight="bolder">
                          {tr.raw('issue key two', {
                              key: keyWatcher,
                          })}
                      </Text>
                  ),
              })
            : tr.raw('Key already exists', { key: keyWatcher })
        : tr('Key must be 3 or longer characters');

    return (
        <>
            <ModalContent>
                <Form onSubmit={isKeyUnique ? handleSubmit(onCreateProject) : undefined}>
                    <StyledProjectTitleContainer>
                        <FormInput
                            {...register('title')}
                            placeholder={tr('Project title')}
                            flat="bottom"
                            brick="right"
                            disabled={busy}
                            error={errorsResolver('title')}
                            onMouseEnter={() => setHoveredInput(true)}
                            onMouseLeave={() => setHoveredInput(false)}
                            onFocus={() => setFocusedInput(true)}
                            onBlur={() => setFocusedInput(false)}
                        />

                        {nullable(titleWatcher, () => (
                            <StyledProjectKeyContainer>
                                <Controller
                                    name="id"
                                    control={control}
                                    render={({ field }) => (
                                        <StyledProjectKeyInputContainer
                                            brick="left"
                                            hovered={hoveredInput}
                                            focused={focusedInput}
                                        >
                                            <KeyInput
                                                disabled={busy}
                                                available={isKeyUnique && isKeyEnoughLength}
                                                tooltip={tooltip}
                                                // FIXME: do it via react-hook-form
                                                onDirty={onKeyDirty}
                                                error={errorsResolver('id')}
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
                        flat="both"
                        minHeight={100}
                        disabled={busy}
                        placeholder={tr('Short description')}
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
                                        text={tr('Flow')}
                                        placeholder={tr('Flow or state title')}
                                        error={errorsResolver(field.name)}
                                        {...field}
                                    />
                                )}
                            />

                            <Link href={routes.help(locale, 'projects')}>
                                <StyledHelpIcon size="s" color={gray9} />
                            </Link>
                        </FormAction>
                    </FormActions>
                    <FormActions flat="top">
                        <FormAction left>
                            <Tip title={tr('Pro tip!')} icon={<BulbOnIcon size="s" color={gray10} />}>
                                {tr.raw('Press key to create project', {
                                    key: <Keyboard command enter />,
                                })}
                            </Tip>
                        </FormAction>
                        <FormAction right inline>
                            <Button
                                outline
                                text={tr('Cancel')}
                                onClick={dispatchModalEvent(ModalEvent.ProjectCreateModal)}
                            />
                            <Button
                                view="primary"
                                disabled={busy}
                                outline={!isValid || !isKeyUnique || !isKeyEnoughLength}
                                type="submit"
                                text={tr('Create')}
                            />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </>
    );
};

export default ProjectCreateForm;
