import { useCallback } from 'react';

import { ProjectCreate, ProjectUpdate, TeamsUpdate } from '../schema/project';
import { trpc } from '../utils/trpcClient';
import { ProjectUpdateReturnType } from '../../trpc/inferredTypes';
import { notifyPromise } from '../utils/notifyPromise';

type Callback<A = []> = (...args: A[]) => void;

export const useProjectResource = (id: string) => {
    const utils = trpc.useContext();
    const createMutation = trpc.project.create.useMutation();
    const updateMutation = trpc.project.update.useMutation();
    const deleteMutation = trpc.project.delete.useMutation();
    const updateTeamsMutation = trpc.project.updateTeams.useMutation();
    const toggleWatcherMutation = trpc.project.toggleWatcher.useMutation();
    const toggleStargizerMutation = trpc.project.toggleStargizer.useMutation();
    const transferOwnershipMutation = trpc.project.transferOwnership.useMutation();
    const getActivityGoals = trpc.project.getActivityGoals.useMutation();
    const addParticipants = trpc.project.addParticipants.useMutation();
    const removeParticipants = trpc.project.removeParticipants.useMutation();

    const invalidate = useCallback(() => {
        utils.v2.project.getById.invalidate({ id });
    }, [id, utils.v2.project.getById]);

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

            invalidate();

            res && cb?.(res);
        },
        [updateMutation, invalidate],
    );

    const deleteProject = useCallback(
        (cb?: Callback) => async () => {
            const promise = deleteMutation.mutateAsync({ id });

            const [res] = await notifyPromise(promise, 'projectDelete');

            res && cb?.();
        },
        [id, deleteMutation],
    );

    const toggleProjectWatching = useCallback(
        async (watcher?: boolean) => {
            await notifyPromise(
                toggleWatcherMutation.mutateAsync({
                    id,
                    direction: !watcher,
                }),
                !watcher ? 'projectWatch' : 'projectUnwatch',
            );

            invalidate();
        },
        [id, toggleWatcherMutation, invalidate],
    );

    const toggleProjectStar = useCallback(
        async (stargizer?: boolean) => {
            await notifyPromise(
                toggleStargizerMutation.mutateAsync({
                    id,
                    direction: !stargizer,
                }),
                !stargizer ? 'projectStar' : 'projectUnstar',
            );

            invalidate();
        },
        [id, toggleStargizerMutation, invalidate],
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

    const checkActivityGoals = useCallback(
        (ownerId: string) => {
            return getActivityGoals.mutateAsync({
                id,
                ownerId,
            });
        },
        [getActivityGoals, id],
    );

    const onProjectParticipantAdd = useCallback(
        async (participants: string[]) => {
            const promise = addParticipants.mutateAsync({ id, participants });

            await notifyPromise(promise, 'projectUpdate');

            invalidate();
        },
        [addParticipants, id, invalidate],
    );

    const onProjectParticipantRemove = useCallback(
        async (participants: string[]) => {
            const promise = removeParticipants.mutateAsync({ id, participants });

            await notifyPromise(promise, 'projectUpdate');

            invalidate();
        },
        [removeParticipants, id, invalidate],
    );

    const updateProjectTeams = useCallback(
        async (data: TeamsUpdate) => {
            const promise = updateTeamsMutation.mutateAsync(data);

            await notifyPromise(promise, 'projectUpdate');

            invalidate();
        },
        [updateTeamsMutation, invalidate],
    );

    return {
        updateProjectTeams,
        createProject,
        updateProject,
        deleteProject,
        toggleProjectWatching,
        toggleProjectStar,
        transferOwnership,
        checkActivityGoals,
        onProjectParticipantAdd,
        onProjectParticipantRemove,
        invalidate,
    };
};
