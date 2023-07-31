type NamespacedAction<T extends string, A extends string> = `${T}${A}`;
type CUDNamespacedAction<T extends string> = NamespacedAction<T, 'Create' | 'Update' | 'Delete'>;
type SubscribeNamespacesAction<T extends string> = NamespacedAction<T, 'Watch' | 'Unwatch' | 'Star' | 'Unstar'>;

type Namespaces =
    | CUDNamespacedAction<'goals'>
    | CUDNamespacedAction<'comment'>
    | NamespacedAction<'project', 'Transfer' | 'Create' | 'Update'>
    | NamespacedAction<'filter', 'Star' | 'Unstar' | 'Delete' | 'Create'>
    | SubscribeNamespacesAction<'project'>
    | SubscribeNamespacesAction<'goals'>
    | 'userSettingsUpdate'
    | 'tagCreate'
    | 'userInvite'
    | 'sentFeedback';

export type { Namespaces as NotificationNamespaces };

export type SimpliestNotificationMessages = {
    error: string;
    clearLSCache: string;
};

export type NotificationMap = Record<
    Namespaces,
    {
        success: string;
        pending: string;
        error?: string;
    }
> &
    SimpliestNotificationMessages;

type NotificationKeyMapFn = (key: Namespaces) => NotificationMap[Namespaces];

export const getNotificicationKeyMap: NotificationKeyMapFn = (key) => {
    const notification: NotificationMap = {
        goalsCreate: {
            success: 'Voila! Goal is here 🎉',
            pending: 'We are creating new goal',
        },
        goalsUpdate: {
            success: 'Voila! Goal is up to date 🎉',
            pending: 'We are updating the goal',
        },
        goalsDelete: {
            success: 'Deleted successfully 🎉',
            pending: 'We are deleting the goal',
        },
        goalsStar: {
            success: 'Voila! You are stargizer now 🎉',
            pending: 'We are calling owner',
        },
        goalsUnstar: {
            success: 'So sad! Goal will miss you',
            pending: 'We are calling owner',
        },
        goalsWatch: {
            success: 'Voila! You are watcher now 🎉',
            pending: 'We are calling owner',
        },
        goalsUnwatch: {
            success: 'So sad! Goal will miss you',
            pending: 'We are calling owner',
        },
        commentCreate: {
            success: 'Voila! Comment is here 🎉',
            pending: 'We are publishing your comment',
        },
        commentUpdate: {
            success: 'Comment updated',
            pending: 'We are updating your comment',
        },
        commentDelete: {
            success: 'Comment removed',
            pending: 'We are deleting your comment',
        },
        projectCreate: {
            success: "Voila! It's here 🎉",
            pending: 'We are creating something new',
        },
        projectUpdate: {
            success: 'Voila! Successfully updated 🎉',
            pending: 'We are updating project settings',
        },
        projectTransfer: {
            success: 'So sad! Project will miss you',
            pending: 'We are calling owner',
        },
        projectStar: {
            success: 'Voila! You are stargizer now 🎉',
            pending: 'We are calling owner',
        },
        projectUnstar: {
            success: 'So sad! Project will miss you',
            pending: 'We are calling owner',
        },
        projectUnwatch: {
            success: 'So sad! Project will miss you',
            pending: 'We are calling owner',
        },
        projectWatch: {
            success: 'Voila! You are watcher now 🎉',
            pending: 'We are calling owner',
        },
        tagCreate: {
            success: 'Voila! Tag is here 🎉',
            pending: 'We are creating new tag',
        },
        userInvite: {
            success: 'Voila! Users invited 🎉',
            pending: 'We are creating invite',
        },
        filterCreate: {
            success: 'Voila! Saved successfully 🎉! Use and share it with teammates 😉',
            pending: 'We are saving your filter...',
        },
        filterDelete: {
            success: 'Deleted successfully 🎉',
            pending: 'We are deleting your filter...',
        },
        filterStar: {
            success: 'Voila! You are stargizer now 🎉',
            pending: 'We are calling owner',
        },
        filterUnstar: {
            success: 'So sad! We will miss you',
            pending: 'We are calling owner',
        },
        userSettingsUpdate: {
            success: 'Voila! Successfully updated 🎉',
            pending: 'We are updating user settings',
        },
        sentFeedback: {
            success: 'Feedback sent 🎉',
            pending: 'Feedback is formed',
        },
        clearLSCache: 'Local cache cleared successfully',
        error: 'Something went wrong 😿',
    };
    return notification[key];
};
