import { getNotificicationKeyMap, NotificationMap } from '../components/NotificationsHub/NotificationHub.map';

export interface NotificationsEventPromiseData {
    promise: Promise<unknown>;
    events: {
        onPending?: string;
        onSuccess?: string;
        onError?: string;
    };
    responseHandler?: (error: any | null, response: any | null) => string | void;
}

export const dispatchPromisedNotificationsEvent = (
    promise: NotificationsEventPromiseData['promise'],
    events: NotificationsEventPromiseData['events'],
    responseHandler: NotificationsEventPromiseData['responseHandler'],
) => {
    window.dispatchEvent(new CustomEvent('notifyPromise', { detail: { promise, events, responseHandler } }));
};

export const dispatchErrorNotification = (key: keyof NotificationMap) => {
    window.dispatchEvent(
        new CustomEvent('notifyError', {
            detail: {
                events: getNotificicationKeyMap(key),
            },
        }),
    );
};

export const dispatchSuccessNotification = (key: keyof NotificationMap) => {
    window.dispatchEvent(
        new CustomEvent('notifySuccess', {
            detail: {
                events: getNotificicationKeyMap(key),
            },
        }),
    );
};
