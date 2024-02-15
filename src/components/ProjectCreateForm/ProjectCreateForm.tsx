import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { Text, Form, FormAction, ModalContent, nullable, setRefs } from '@taskany/bricks';
import { Button, FormControl, FormControlInput, FormControlError, Textarea, Tooltip } from '@taskany/bricks/harmony';

import { keyPredictor } from '../../utils/keyPredictor';
import { errorsProvider } from '../../utils/forms';
import { useRouter } from '../../hooks/router';
import { useProjectResource } from '../../hooks/useProjectResource';
import { FlowComboBox } from '../FlowComboBox';
import { trpc } from '../../utils/trpcClient';
import { ProjectCreate, projectCreateSchema } from '../../schema/project';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { HelpButton } from '../HelpButton/HelpButton';
import {
    projectCancelButton,
    projectCreateForm,
    projectDescriptionInput,
    projectSubmitButton,
    projectTitleInput,
} from '../../utils/domObjects';
import RotatableTip from '../RotatableTip/RotatableTip';
import { FormActions } from '../FormActions/FormActions';

import { tr } from './ProjectCreateForm.i18n';
import s from './ProjectCreateForm.module.css';

const KeyInput = dynamic(() => import('../KeyInput'));

const ProjectCreateForm: React.FC = () => {
    const router = useRouter();
    const { createProject } = useProjectResource('');
    const [busy, setBusy] = useState(false);
    const [dirtyKey, setDirtyKey] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setFocus,
        setValue,
        control,
        formState: { errors, isSubmitted },
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

    const isKeyEnoughLength = Boolean(keyWatcher?.length >= 3);
    const flowRecomendations = trpc.flow.recommedations.useQuery();
    const existingProject = trpc.project.getById.useQuery(
        {
            id: keyWatcher,
        },
        {
            enabled: isKeyEnoughLength,
        },
    );

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

    const titleChangeHandler = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
        (event) => {
            setValue('title', event.target.value);
            if (!dirtyKey && !!event.target.value) {
                setValue('id', keyPredictor(event.target.value));
            }
        },
        [setValue, dirtyKey],
    );

    // eslint-disable-next-line no-nested-ternary
    const tooltip = isKeyEnoughLength
        ? isKeyUnique
            ? tr.raw('Perfect! Issues and goals will look like', {
                  perfect: (
                      <Text key="perfect" as="span" size="s" weight="bolder">
                          {tr('Perfect')}
                      </Text>
                  ),
                  issueKeyOne: (
                      <Text key="issue key one" as="span" size="s" weight="bolder">
                          {tr.raw('issue key one', {
                              key: keyWatcher,
                          })}
                      </Text>
                  ),
                  issueKeyTwo: (
                      <Text key="issue key two" as="span" size="s" weight="bolder">
                          {tr.raw('issue key two', {
                              key: keyWatcher,
                          })}
                      </Text>
                  ),
              })
            : tr.raw('Key already exists', { key: keyWatcher })
        : tr('Key must be 3 or longer characters');

    const errorRef = useRef<HTMLTextAreaElement>(null);
    const error = errorsResolver('description');

    return (
        <>
            <ModalContent>
                <Form onSubmit={isKeyUnique ? handleSubmit(onCreateProject) : undefined} {...projectCreateForm.attr}>
                    <div className={s.ProjectTitleContainer}>
                        <FormControl className={s.FormControl}>
                            <FormControlInput
                                {...register('title')}
                                onChange={titleChangeHandler}
                                disabled={busy}
                                placeholder={tr('Project title')}
                                brick="bottom"
                                size="m"
                                {...projectTitleInput.attr}
                            />
                            {nullable(errorsResolver('title'), (error) => (
                                <FormControlError error={error} />
                            ))}
                        </FormControl>

                        {nullable(titleWatcher, () => (
                            <Controller
                                name="id"
                                control={control}
                                render={({ field }) => (
                                    <KeyInput
                                        disabled={busy}
                                        available={isKeyUnique && isKeyEnoughLength}
                                        tooltip={tooltip}
                                        onDirty={onKeyDirty}
                                        error={errorsResolver('id')}
                                        {...field}
                                    />
                                )}
                            />
                        ))}
                    </div>

                    <Textarea
                        {...register('description')}
                        brick="center"
                        disabled={busy}
                        height={200}
                        placeholder={tr('Short description')}
                        ref={setRefs(errorRef, register('description').ref)}
                        view={error && 'danger'}
                        {...projectDescriptionInput.attr}
                    />
                    {nullable(error, (err) => (
                        <Tooltip reference={errorRef} view="danger">
                            {err.message}
                        </Tooltip>
                    ))}

                    <FormActions>
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

                            <HelpButton slug="projects" />
                        </FormAction>
                    </FormActions>

                    <FormActions>
                        <FormAction left>
                            <RotatableTip context="project" />
                        </FormAction>
                        <FormAction right inline>
                            <Button
                                text={tr('Cancel')}
                                onClick={dispatchModalEvent(ModalEvent.ProjectCreateModal)}
                                {...projectCancelButton.attr}
                            />
                            <Button
                                view="primary"
                                disabled={busy}
                                type="submit"
                                text={tr('Create')}
                                {...projectSubmitButton.attr}
                            />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </>
    );
};

export default ProjectCreateForm;
