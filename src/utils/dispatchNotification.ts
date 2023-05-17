import { SimpliestNotificationMessages, notificationKeyMap } from '../components/NotificationsHub/NotificationHub.map';

export interface NotificationsEventPromiseData {
    promise: Promise<unknown>;
    events: {
        onPending: string;
        onSuccess: string;
        onError: string;
    };
}

export const dispatchPromisedNotificationsEvent = (
    promise: NotificationsEventPromiseData['promise'],
    events: NotificationsEventPromiseData['events'],
) => {
    window.dispatchEvent(new CustomEvent('notifyPromise', { detail: { promise, events } }));
};

export const dispatchErrorNotification = (key: keyof SimpliestNotificationMessages) => {
    window.dispatchEvent(
        new CustomEvent('notifyError', {
            detail: notificationKeyMap[key],
        }),
    );
};

export const dispatchSuccessNotification = (key: keyof SimpliestNotificationMessages) => {
    window.dispatchEvent(
        new CustomEvent('notifySuccess', {
            detail: notificationKeyMap[key],
        }),
    );
};
