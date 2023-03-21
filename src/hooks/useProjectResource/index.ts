import { useCallback } from 'react';
import toast from 'react-hot-toast';
import z from 'zod';

import { Project } from '../../../graphql/@generated/genql';
import { gql } from '../../utils/gql';

import { tr } from './useProjectResource.i18n';

type Callback<A = []> = (...args: A[]) => void;

export const createProjectSchemaProvider = () =>
    z.object({
        title: z
            .string({
                required_error: tr("Project's title is required"),
                invalid_type_error: tr("Project's title must be a string"),
            })
            .min(2, {
                message: tr("Project's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
        flow: z.object({
            id: z.string(),
        }),
        key: z.string().min(3),
    });
export const updateProjectSchemaProvider = () =>
    z.object({
        title: z
            .string({
                required_error: tr("Project's title is required"),
                invalid_type_error: tr("Project's title must be a string"),
            })
            .min(2, {
                message: tr("Project's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
        teams: z
            .array(
                z.object({
                    id: z.number(),
                    title: z.string(),
                }),
            )
            .optional(),
    });

export type CreateProjectFormType = z.infer<ReturnType<typeof createProjectSchemaProvider>>;
export type UpdateProjectFormType = z.infer<ReturnType<typeof updateProjectSchemaProvider>>;

export const useProjectResource = (id: number) => {
    const createProject = useCallback(
        (cb: Callback<Project['key']>) => async (form: CreateProjectFormType) => {
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
                        key: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are creating new project'),
                success: tr('Voila! Project is here 🎉'),
            });

            const res = await promise;

            res.createProject && cb(res.createProject.key);
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
                            teams: data.teams?.map((team) => team.id) || [],
                        },
                    },
                    {
                        title: true,
                        description: true,
                        teams: {
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

    return {
        createProject,
        updateProject,
        deleteProject,
        toggleProjectWatching,
        toggleProjectStar,
    };
};
