import React, { FormEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { nullable, setRefs } from '@taskany/bricks';
import {
    Text,
    Button,
    FormControl,
    FormControlInput,
    FormControlError,
    Textarea,
    Tooltip,
    ModalContent,
} from '@taskany/bricks/harmony';
import { IconGitPullOutline } from '@taskany/icons';
import { z } from 'zod';

import { keyPredictor } from '../../utils/keyPredictor';
import { errorsProvider } from '../../utils/forms';
import { useRouter } from '../../hooks/router';
import { useProjectResource } from '../../hooks/useProjectResource';
import { FlowDropdown } from '../FlowDropdown/FlowDropdown';
import { trpc } from '../../utils/trpcClient';
import { ProjectCreate, projectCreateSchema } from '../../schema/project';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { GoalParentDropdown } from '../GoalParentDropdown/GoalParentDropdown';
import { HelpButton } from '../HelpButton/HelpButton';
import {
    projectCancelButton,
    projectCreateForm,
    projectDescriptionInput,
    projectSubmitButton,
    projectTitleInput,
} from '../../utils/domObjects';
import RotatableTip from '../RotatableTip/RotatableTip';
import { FormAction, FormActions } from '../FormActions/FormActions';
import { ProjectContext } from '../ProjectContext/ProjectContext';

import { tr } from './ProjectCreateForm.i18n';
import s from './ProjectCreateForm.module.css';

const KeyInput = dynamic(() => import('../KeyInput/KeyInput'));

const getPatchedProjectCreateSchema = (checkKeyHandler: ({ id }: { id: string }) => Promise<null>) => {
    return projectCreateSchema.extend({
        id: z
            .string()
            .min(3, tr('Key must be 3 or longer characters'))
            .superRefine(async (val, ctx) => {
                try {
                    await checkKeyHandler({ id: val });
                    return z.NEVER;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (error: any) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: error.message,
                    });
                }
            }),
    });
};

const ProjectCreateForm: React.FC = () => {
    const router = useRouter();
    const { createProject, checkUniqueProjectKey } = useProjectResource('');
    const [busy, setBusy] = useState(false);

    const { project: parent } = useContext(ProjectContext);
    const { data: flowRecomendations = [] } = trpc.flow.recommedations.useQuery();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        trigger,
        formState: { errors, isSubmitted, isValid },
    } = useForm<ProjectCreate>({
        resolver: zodResolver(getPatchedProjectCreateSchema(checkUniqueProjectKey)),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: false,
        defaultValues: {
            parent: parent ? [{ id: parent.id, title: parent.title }] : undefined,
            flow: flowRecomendations[0],
        },
    });

    const errorsResolver = useCallback(
        (key: keyof typeof errors) => errorsProvider(errors, isSubmitted)(key),
        [errors, isSubmitted],
    );
    const titleWatcher = watch('title');
    const keyWatcher = watch('id');
    const flowWatch = watch('flow');

    useEffect(() => {
        if (!flowWatch && flowRecomendations.length) {
            setValue('flow', flowRecomendations[0]);
        }
    }, [setValue, flowRecomendations, flowWatch]);

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

    const onSubmit = useCallback(
        (e: FormEvent<HTMLFormElement>) => {
            e?.preventDefault();
            handleSubmit(onCreateProject)(e);
        },
        [handleSubmit, onCreateProject],
    );

    useEffect(() => {
        const titleWatch = watch(({ title }, { name, type }) => {
            if (type === 'change') {
                if (name === 'title') {
                    if (title != null && title.length > 0) {
                        setValue('id', keyPredictor(title));
                    } else {
                        setValue('id', '');
                    }

                    trigger('id');
                }
            }
        });

        return () => {
            titleWatch.unsubscribe();
        };
    }, [watch, setValue, trigger]);

    const tooltip =
        // eslint-disable-next-line no-nested-ternary
        keyWatcher?.length >= 3
            ? errors.id?.message == null
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
                : null
            : null;

    const errorRef = useRef<HTMLTextAreaElement>(null);
    const error = errorsResolver('description');

    const disableSubmitBtn = useMemo(() => {
        return !isValid || busy;
    }, [busy, isValid]);

    return (
        <>
            <ModalContent>
                <form className={s.Form} onSubmit={onSubmit} {...projectCreateForm.attr}>
                    <div>
                        <div className={s.ProjectTitleContainer}>
                            <FormControl className={s.FormControl}>
                                <FormControlInput
                                    {...register('title')}
                                    disabled={busy}
                                    placeholder={tr('Project title')}
                                    brick="bottom"
                                    size="m"
                                    autoFocus
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
                                    render={({ field, fieldState }) => (
                                        <KeyInput
                                            size="m"
                                            disabled={busy}
                                            available={keyWatcher?.length >= 3}
                                            tooltip={tooltip}
                                            error={fieldState.error}
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
                    </div>

                    <FormActions className={s.FormActions} align="left">
                        <FormAction className={s.FormAction}>
                            <Controller
                                name="parent"
                                control={control}
                                render={({ field }) => (
                                    <GoalParentDropdown
                                        mode="multiple"
                                        label="Parent projects"
                                        placeholder={tr('Enter project')}
                                        error={errorsResolver(field.name)}
                                        disabled={busy}
                                        className={s.ProjectFormParentDropdown}
                                        {...field}
                                    />
                                )}
                            />
                        </FormAction>
                        <FormAction className={s.FormAction}>
                            <Controller
                                name="flow"
                                control={control}
                                render={({ field }) => (
                                    <FlowDropdown
                                        mode="single"
                                        placeholder={tr('Flow or state title')}
                                        error={errorsResolver(field.name)}
                                        renderTrigger={(props) => (
                                            <Button
                                                disabled
                                                view="ghost"
                                                text={field.value?.title || tr('Flow')}
                                                onClick={props.onClick}
                                                iconLeft={<IconGitPullOutline size="s" />}
                                            />
                                        )}
                                        {...field}
                                    />
                                )}
                            />

                            <HelpButton slug="projects" />
                        </FormAction>
                    </FormActions>

                    <FormActions className={s.FormActions} align="space-between">
                        <RotatableTip context="project" />
                        <FormAction>
                            <Button
                                text={tr('Cancel')}
                                onClick={dispatchModalEvent(ModalEvent.ProjectCreateModal)}
                                {...projectCancelButton.attr}
                            />
                            <Button
                                view="primary"
                                disabled={disableSubmitBtn}
                                type="submit"
                                text={tr('Create')}
                                {...projectSubmitButton.attr}
                            />
                        </FormAction>
                    </FormActions>
                </form>
            </ModalContent>
        </>
    );
};

export default ProjectCreateForm;
