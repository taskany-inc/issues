import { useCallback } from 'react';

import { trpc } from '../utils/trpcClient';

interface CrewUser {
    email: string;
    name?: string;
    login?: string;
}

export const useUserResource = () => {
    const createUserMutation = trpc.user.сreateUserByCrew.useMutation();

    const createUserByCrew = useCallback(
        async (user: CrewUser) => createUserMutation.mutateAsync(user),
        [createUserMutation],
    );

    return {
        createUserByCrew,
    };
};
