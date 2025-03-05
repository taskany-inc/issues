import { useEffect } from 'react';

import { trpc } from '../utils/trpcClient';
import { useGoalPreview } from '../components/GoalPreview/GoalPreviewProvider';

export const useGoalPreviewInvalidate = <T extends { _shortId: string; projectId: string | null }>(goals: T[]) => {
    const { on } = useGoalPreview();
    const utils = trpc.useContext();

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', (updatedId) => {
            const idInList = goals.find(({ _shortId }) => _shortId === updatedId);
            if (idInList?.projectId != null) {
                utils.v2.project.getProjectGoalsById.invalidate({ id: idInList.projectId });
                utils.project.getByIds.invalidate({ ids: [idInList.projectId] });
            }
        });

        const unsubDelete = on('on:goal:delete', (updatedId) => {
            const idInList = goals.find(({ _shortId }) => _shortId === updatedId);
            if (idInList?.projectId != null) {
                utils.v2.project.getProjectGoalsById.invalidate({ id: idInList.projectId });
            }
        });

        return () => {
            unsubDelete();
            unsubUpdate();
        };
    }, [on, goals, utils.project.getByIds, utils.v2.project.getProjectGoalsById]);
};
