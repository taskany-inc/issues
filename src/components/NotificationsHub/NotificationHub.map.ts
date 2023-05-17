import { tr } from './NotificationsHub.i18n';

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
    | 'userInvite';

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

export const notificationKeyMap: NotificationMap = {
    goalsCreate: {
        success: tr('Voila! Goal is here 🎉'),
        pending: tr('We are creating new goal'),
    },
    goalsUpdate: {
        success: tr('Voila! Goal is up to date 🎉'),
        pending: tr('We are updating the goal'),
    },
    goalsDelete: {
        success: tr('Deleted successfully 🎉'),
        pending: tr('We are deleting the goal'),
    },
    goalsStar: {
        success: tr('Voila! You are stargizer now 🎉'),
        pending: tr('We are calling owner'),
    },
    goalsUnstar: {
        success: tr('So sad! Goal will miss you'),
        pending: tr('We are calling owner'),
    },
    goalsWatch: {
        success: tr('Voila! You are watcher now 🎉'),
        pending: tr('We are calling owner'),
    },
    goalsUnwatch: {
        success: tr('So sad! Goal will miss you'),
        pending: tr('We are calling owner'),
    },
    commentCreate: {
        success: tr('Voila! Comment is here 🎉'),
        pending: tr('We are publishing your comment'),
    },
    commentUpdate: {
        success: tr('Comment updated'),
        pending: tr('We are updating your comment'),
    },
    commentDelete: {
        success: tr('Comment removed'),
        pending: tr('We are deleting your comment'),
    },
    projectCreate: {
        success: tr("Voila! It's here 🎉"),
        pending: tr('We are creating something new'),
    },
    projectUpdate: {
        success: tr('Voila! Successfully updated 🎉'),
        pending: tr('We are updating project settings'),
    },
    projectTransfer: {
        success: tr('So sad! Project will miss you'),
        pending: tr('We are calling owner'),
    },
    projectStar: {
        success: tr('Voila! You are stargizer now 🎉'),
        pending: tr('We are calling owner'),
    },
    projectUnstar: {
        success: tr('So sad! Project will miss you'),
        pending: tr('We are calling owner'),
    },
    projectUnwatch: {
        success: tr('So sad! Project will miss you'),
        pending: tr('We are calling owner'),
    },
    projectWatch: {
        success: tr('Voila! You are watcher now 🎉'),
        pending: tr('We are calling owner'),
    },
    tagCreate: {
        success: tr('Voila! Tag is here 🎉'),
        pending: tr('We are creating new tag'),
    },
    userInvite: {
        success: tr('Voila! Users invited 🎉'),
        pending: tr('We are creating invite'),
    },
    filterCreate: {
        success: tr('Voila! Saved successfully 🎉! Use and share it with teammates 😉'),
        pending: tr('We are saving your filter...'),
    },
    filterDelete: {
        success: tr('Deleted successfully 🎉'),
        pending: tr('We are deleting your filter...'),
    },
    filterStar: {
        success: tr('Voila! You are stargizer now 🎉'),
        pending: tr('We are calling owner'),
    },
    filterUnstar: {
        success: tr('So sad! We will miss you'),
        pending: tr('We are calling owner'),
    },
    userSettingsUpdate: {
        success: tr('Voila! Successfully updated 🎉'),
        pending: tr('We are updating user settings'),
    },
    clearLSCache: tr('Local cache cleared successfully'),
    error: tr('Something went wrong 😿'),
};
