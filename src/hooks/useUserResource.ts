import { useCallback } from 'react';

import { trpc } from '../utils/trpcClient';
import { CrewUser } from '../types/crew';

export const useUserResource = () => {
    const getUsersByCrewMutation = trpc.user.getLocalUsersByCrew.useMutation();

    const getUsersByCrew = useCallback(
        async (users: CrewUser[]) => getUsersByCrewMutation.mutateAsync(users),
        [getUsersByCrewMutation],
    );

    return {
        getUsersByCrew,
    };
};
