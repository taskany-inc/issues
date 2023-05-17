import { useCallback } from 'react';

import { ProjectCreate, ProjectUpdate } from '../schema/project';
import { trpc } from '../utils/trpcClient';
import { ProjectUpdateReturnType } from '../../trpc/inferredTypes';
import { notifyPromise } from '../utils/notifyPromise';

type Callback<A = []> = (...args: A[]) => void;

export const useProjectResource = (id: string) => {
    const utils = trpc.useContext();
    const createMutation = trpc.project.create.useMutation();
    const updateMutation = trpc.project.update.useMutation();
    const deleteMutation = trpc.project.delete.useMutation();
    const toggleWatcherMutation = trpc.project.toggleWatcher.useMutation();
    const toggleStargizerMutation = trpc.project.toggleStargizer.useMutation();
    const transferOwnershipMutation = trpc.project.transferOwnership.useMutation();

    const createProject = useCallback(
        (cb: Callback<string>) => async (form: ProjectCreate) => {
            const promise = createMutation.mutateAsync(form);

            notifyPromise(promise, 'projectCreate');

            const res = await promise;

            res && cb(res.id);
        },
        [createMutation],
    );

    const updateProject = useCallback(
        (cb?: Callback<ProjectUpdateReturnType>) => async (data: ProjectUpdate) => {
            const promise = updateMutation.mutateAsync(data);

            notifyPromise(promise, 'projectUpdate');

            const res = await promise;

            utils.project.getById.invalidate(id);

            res && cb?.(res);
        },
        [id, updateMutation, utils],
    );

    const deleteProject = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (cb: Callback) => async () => {
            const res = await deleteMutation.mutateAsync(id);

            res && cb();
        },
        [id, deleteMutation],
    );

    const toggleProjectWatching = useCallback(
        (cb: Callback, watcher?: boolean) => async () => {
            const promise = toggleWatcherMutation.mutateAsync({
                id,
                direction: !watcher,
            });

            notifyPromise(promise, !watcher ? 'projectWatch' : 'projectUnwatch');

            cb();

            await promise;
        },
        [id, toggleWatcherMutation],
    );

    const toggleProjectStar = useCallback(
        (cb: Callback, stargizer?: boolean) => async () => {
            const promise = toggleStargizerMutation.mutateAsync({
                id,
                direction: !stargizer,
            });

            notifyPromise(promise, !stargizer ? 'projectStar' : 'projectUnstar');

            cb();

            await promise;
        },
        [id, toggleStargizerMutation],
    );

    const transferOwnership = useCallback(
        (cb: Callback, activityId: string) => async () => {
            const promise = transferOwnershipMutation.mutateAsync({
                id,
                activityId,
            });

            notifyPromise(promise, 'projectTransfer');

            const res = await promise;

            res && cb();
        },
        [id, transferOwnershipMutation],
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
