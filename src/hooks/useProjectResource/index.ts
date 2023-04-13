import { useCallback } from 'react';
import toast from 'react-hot-toast';
import z from 'zod';

import { Project } from '../../../graphql/@generated/genql';
import { gql } from '../../utils/gql';

import { tr } from './useProjectResource.i18n';

type Callback<A = []> = (...args: A[]) => void;

export const createProjectSchemaProvider = () =>
    z.object({
        id: z.string().min(3),
        title: z
            .string({
                required_error: tr('Title is required'),
                invalid_type_error: tr('Title must be a string'),
            })
            .min(2, {
                message: tr('Title must be longer than 2 symbols'),
            })
            .max(50, {
                message: tr('Title can be 50 symbols maximum'),
            }),
        description: z.string().optional(),
        flow: z.object({
            id: z.string(),
        }),
    });
export const updateProjectSchemaProvider = () =>
    z.object({
        title: z
            .string({
                required_error: tr('Title is required'),
                invalid_type_error: tr('Title must be a string'),
            })
            .min(2, {
                message: tr('Title must be longer than 2 symbols'),
            }),
        description: z.string().optional(),
        parent: z
            .array(
                z.object({
                    id: z.string(),
                    title: z.string(),
                }),
            )
            .optional(),
    });

export type CreateProjectFormType = z.infer<ReturnType<typeof createProjectSchemaProvider>>;
export type UpdateProjectFormType = z.infer<ReturnType<typeof updateProjectSchemaProvider>>;

export const useProjectResource = (id: string) => {
    const createProject = useCallback(
        (cb: Callback<Project['id']>) => async (form: CreateProjectFormType) => {
            const promise = gql.mutation({
                createProject: [
                    {
                        data: {
                            id: form.id,
                            title: form.title,
                            description: form.description,
                            flowId: form.flow.id,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are creating something new'),
                success: tr("Voila! It's here 🎉"),
            });

            const res = await promise;

            res.createProject && cb(res.createProject.id);
        },
        [],
    );

    const updateProject = useCallback(
        (cb: Callback<UpdateProjectFormType>) => async (data: UpdateProjectFormType) => {
            const promise = gql.mutation({
                updateProject: [
                    {
                        data: {
                            id,
                            title: data.title,
                            description: data.description,
                            parent: data.parent?.map((p) => p.id) || [],
                        },
                    },
                    {
                        title: true,
                        description: true,
                        parent: {
                            id: true,
                            title: true,
                        },
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are updating project settings'),
                success: tr('Voila! Successfully updated 🎉'),
            });

            const res = await promise;

            res.updateProject && cb(res.updateProject);
        },
        [id],
    );

    const deleteProject = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (cb: Callback) => async () => {
            const res = await gql.mutation({
                deleteProject: [
                    {
                        data: {
                            id,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            res.deleteProject && cb();
        },
        [id],
    );

    const toggleProjectWatching = useCallback(
        (cb: Callback, watcher?: boolean) => async () => {
            const promise = gql.mutation({
                toggleProjectWatcher: [
                    {
                        data: {
                            id: String(id),
                            direction: !watcher,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are calling owner'),
                success: !watcher ? tr('Voila! You are watcher now 🎉') : tr('So sad! Project will miss you'),
            });

            cb();

            await promise;
        },
        [id],
    );

    const toggleProjectStar = useCallback(
        (cb: Callback, stargizer?: boolean) => async () => {
            const promise = gql.mutation({
                toggleProjectStargizer: [
                    {
                        data: {
                            id: String(id),
                            direction: !stargizer,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are calling owner'),
                success: !stargizer ? tr('Voila! You are stargizer now 🎉') : tr('So sad! Project will miss you'),
            });

            cb();

            await promise;
        },
        [id],
    );

    const transferOwnership = useCallback(
        (cb: Callback, activityId?: string) => async () => {
            if (!activityId) return;

            const promise = gql.mutation({
                transferProjectOwnership: [
                    {
                        data: {
                            id,
                            activityId,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are calling owner'),
                success: tr('So sad! Project will miss you'),
            });

            const res = await promise;

            res.transferProjectOwnership && cb();
        },
        [id],
    );

    return {
        createProject,
        updateProject,
        deleteProject,
        toggleProjectWatching,
        toggleProjectStar,
        transferOwnership,
    };
};
