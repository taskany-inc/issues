import { trpc } from '../utils/trpcClient';
import { ReactionsMap } from '../types/reactions';

const reactionsGroupsLimit = 10;

export const useReactionsResource = (reactions?: ReactionsMap) => {
    const toggleMutation = trpc.reaction.toggle.useMutation();
    const reactionsEmoji = Object.keys(reactions || {});

    const limited = reactionsEmoji.length >= reactionsGroupsLimit;

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

    return { reactionsProps: { limited }, goalReaction, commentReaction };
};
