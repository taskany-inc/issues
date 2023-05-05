import { useMemo } from 'react';
import { Reaction } from '@prisma/client';

import { trpc } from '../utils/trpcClient';

const reactionsGroupsLimit = 10;
type ReactionsMap = Record<string, { count: number; authors: Set<string> }>;

export const useReactionsResource = (r?: Reaction[]) => {
    const toggleMutation = trpc.reaction.toggle.useMutation();

    const reactions = useMemo(
        () =>
            r?.reduce((acc, curr) => {
                if (!curr) return acc;

                acc[curr.emoji] = acc[curr.emoji]
                    ? {
                          count: acc[curr.emoji].count + 1,
                          authors: acc[curr.emoji].authors.add(curr.activityId),
                      }
                    : {
                          count: 1,
                          authors: new Set(),
                      };

                return acc;
            }, {} as ReactionsMap),
        [r],
    );

    const reactionsNames = Object.keys(reactions || {});

    const limited = reactionsNames.length >= reactionsGroupsLimit;

    const goalReaction = (goalId: string, cb?: () => void) => async (emoji?: string) => {
        if (!emoji) return;

        await toggleMutation.mutateAsync({
            emoji,
            goalId,
        });

        cb?.();
    };

    const commentReaction = (commentId: string, cb?: () => void) => async (emoji?: string) => {
        if (!emoji) return;

        await toggleMutation.mutateAsync({
            emoji,
            commentId,
        });

        cb?.();
    };

    return { reactionsProps: { reactions, limited }, goalReaction, commentReaction };
};
