import { useCallback } from 'react';
import toast from 'react-hot-toast';
import z from 'zod';

import { Project } from '../../graphql/@generated/genql';
import { gql } from '../utils/gql';

// import { usePageContext } from './usePageContext';

type KeySet = (key: string) => string;
type Callback<A = []> = (...args: A[]) => void;

export const createProjectSchemaProvider = (t: KeySet) =>
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
export const updateProjectSchemaProvider = (t: KeySet) =>
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
    });

export type CreateProjectFormType = z.infer<ReturnType<typeof createProjectSchemaProvider>>;
export type UpdateProjectFormType = z.infer<ReturnType<typeof updateProjectSchemaProvider>>;

export const useProjectResource = (id: number) => {
    // const { user } = usePageContext();

    const createProject = useCallback(
        (cb: Callback<Project['key']>, t: KeySet) => async (form: CreateProjectFormType) => {
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
                error: t('Something went wrong 😿'),
                loading: t('We are creating new project'),
                success: t('Voila! Project is here 🎉'),
            });

            const res = await promise;

            res.createProject && cb(res.createProject.key);
        },
        [],
    );

    const updateProject = useCallback(
        (cb: Callback<UpdateProjectFormType>, t: KeySet) => async (data: UpdateProjectFormType) => {
            const promise = gql.mutation({
                updateProject: [
                    {
                        data: {
                            id,
                            ...data,
                        },
                    },
                    {
                        title: true,
                        description: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: t('Something went wrong 😿'),
                loading: t('We are updating project settings'),
                success: t('Voila! Successfully updated 🎉'),
            });

            const res = await promise;

            res.updateProject && cb(res.updateProject);
        },
        [id],
    );

    const deleteProject = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (cb: Callback, t: KeySet) => async () => {
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
        (cb: Callback, t: KeySet, watcher?: boolean) => async () => {
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
                error: t('Something went wrong 😿'),
                loading: t('We are calling owner'),
                success: t(!watcher ? 'Voila! You are watcher now 🎉' : 'So sad! Project will miss you'),
            });

            cb();

            await promise;
        },
        [id],
    );

    const toggleProjectStar = useCallback(
        (cb: Callback, t: KeySet, stargizer?: boolean) => async () => {
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
                error: t('Something went wrong 😿'),
                loading: t('We are calling owner'),
                success: t(!stargizer ? 'Voila! You are stargizer now 🎉' : 'So sad! Goal will miss you'),
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
