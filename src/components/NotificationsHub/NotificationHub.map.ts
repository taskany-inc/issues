type NamespacedAction<T extends string, A extends string> = `${T}${A}`;
type CUDNamespacedAction<T extends string> = NamespacedAction<T, 'Create' | 'Update' | 'Delete'>;
type SubscribeNamespacesAction<T extends string> = NamespacedAction<T, 'Watch' | 'Unwatch' | 'Star' | 'Unstar'>;

type Namespaces =
    | CUDNamespacedAction<'goals'>
    | CUDNamespacedAction<'comment'>
    | CUDNamespacedAction<'criteria'>
    | NamespacedAction<'project', 'Transfer' | 'Create' | 'Update' | 'Delete'>
    | NamespacedAction<'filter', 'Star' | 'Unstar' | 'Delete' | 'Create'>
    | SubscribeNamespacesAction<'project'>
    | SubscribeNamespacesAction<'goals'>
    | 'exportCsv'
    | 'userSettingsUpdate'
    | 'tagCreate'
    | 'userInvite'
    | 'sentFeedback'
    | 'clearLSCache'
    | 'error'
    | 'copy';

export type { Namespaces as NotificationNamespaces };

export type NotificationMap = Record<
    Namespaces,
    {
        onPending?: string;
        onSuccess?: string;
        onError?: string;
    }
>;

export const getNotificicationKeyMap = (key: keyof NotificationMap) => {
    const notification: NotificationMap = {
        goalsCreate: {
            onSuccess: 'Voila! Goal is here 🎉',
            onPending: 'We are creating new goal',
        },
        goalsUpdate: {
            onSuccess: 'Voila! Goal is up to date 🎉',
            onPending: 'We are updating the goal',
        },
        goalsDelete: {
            onSuccess: 'Deleted successfully 🎉',
            onPending: 'We are deleting the goal',
        },
        goalsStar: {
            onSuccess: 'Voila! You are stargizer now 🎉',
            onPending: 'We are calling owner',
        },
        goalsUnstar: {
            onSuccess: 'So sad! Goal will miss you',
            onPending: 'We are calling owner',
        },
        goalsWatch: {
            onSuccess: 'Voila! You are watcher now 🎉',
            onPending: 'We are calling owner',
        },
        goalsUnwatch: {
            onSuccess: 'So sad! Goal will miss you',
            onPending: 'We are calling owner',
        },
        commentCreate: {
            onSuccess: 'Voila! Comment is here 🎉',
            onPending: 'We are publishing your comment',
        },
        commentUpdate: {
            onSuccess: 'Comment updated',
            onPending: 'We are updating your comment',
        },
        commentDelete: {
            onSuccess: 'Comment removed',
            onPending: 'We are deleting your comment',
        },
        projectCreate: {
            onSuccess: "Voila! It's here 🎉",
            onPending: 'We are creating something new',
        },
        projectUpdate: {
            onSuccess: 'Voila! Successfully updated 🎉',
            onPending: 'We are updating project settings',
        },
        projectTransfer: {
            onSuccess: 'So sad! Project will miss you',
            onPending: 'We are calling owner',
        },
        projectStar: {
            onSuccess: 'Voila! You are stargizer now 🎉',
            onPending: 'We are calling owner',
        },
        projectUnstar: {
            onSuccess: 'So sad! Project will miss you',
            onPending: 'We are calling owner',
        },
        projectUnwatch: {
            onSuccess: 'So sad! Project will miss you',
            onPending: 'We are calling owner',
        },
        projectWatch: {
            onSuccess: 'Voila! You are watcher now 🎉',
            onPending: 'We are calling owner',
        },
        projectDelete: {
            onSuccess: 'Project removed',
            onPending: 'We are deleting the project',
        },
        tagCreate: {
            onSuccess: 'Voila! Tag is here 🎉',
            onPending: 'We are creating new tag',
        },
        userInvite: {
            onSuccess: 'Voila! Users invited 🎉',
            onPending: 'We are creating invite',
        },
        filterCreate: {
            onSuccess: 'Voila! Saved successfully 🎉! Use and share it with teammates 😉',
            onPending: 'We are saving your filter...',
        },
        filterDelete: {
            onSuccess: 'Deleted successfully 🎉',
            onPending: 'We are deleting your filter...',
        },
        filterStar: {
            onSuccess: 'Voila! You are stargizer now 🎉',
            onPending: 'We are calling owner',
        },
        filterUnstar: {
            onSuccess: 'So sad! We will miss you',
            onPending: 'We are calling owner',
        },
        userSettingsUpdate: {
            onSuccess: 'Voila! Successfully updated 🎉',
            onPending: 'We are updating user settings',
        },
        sentFeedback: {
            onSuccess: 'Feedback sent 🎉',
            onPending: 'Feedback is formed',
        },
        clearLSCache: {
            onSuccess: 'Local cache cleared successfully',
        },
        error: {
            onError: 'Something went wrong 😿',
        },
        copy: {
            onSuccess: 'Successfully copied',
            onPending: 'Copying...',
            onError: 'An error occurred while copying',
        },
        criteriaCreate: {
            onSuccess: 'Voila! New criteria created 🎉',
            onPending: 'Creating...',
        },
        criteriaDelete: {
            onSuccess: 'Deleted successfully 🎉',
            onPending: 'We are deleting criteria...',
        },
        criteriaUpdate: {
            onSuccess: 'Voila! Successfully updated 🎉',
            onPending: 'We are updating criteria...',
        },
        exportCsv: {
            onSuccess: 'Viola! You can save the exported data',
            onPending: 'We are forming data for export...',
        },
    };

    return notification[key];
};
