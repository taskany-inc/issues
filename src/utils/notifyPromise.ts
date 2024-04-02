import { getNotificicationKeyMap, NotificationNamespaces } from '../components/NotificationsHub/NotificationHub.map';

import { NotificationsEventPromiseData, dispatchPromisedNotificationsEvent } from './dispatchNotification';

interface NotifyPromise {
    <T>(
        promise: Promise<T>,
        events: NotificationsEventPromiseData['events'],
        errorHandler?: (error: any) => string | void,
    ): PromiseLike<[T, null] | [null, T]>;
    <T>(
        promise: Promise<T>,
        namespace: NotificationNamespaces,
        errorHandler?: (error: any) => string | void,
    ): PromiseLike<[T, null] | [null, T]>;
}

export const notifyPromise: NotifyPromise = (promise, eventsOrNamespace, errorHandler) => {
    let events: NotificationsEventPromiseData['events'];

    if (typeof eventsOrNamespace === 'string') {
        const notifyMap = getNotificicationKeyMap(eventsOrNamespace);

        events = {
            onSuccess: notifyMap.onSuccess,
            onPending: notifyMap.onPending,
            onError: notifyMap.onError ?? getNotificicationKeyMap('error').onError,
        };
    } else {
        events = eventsOrNamespace;
    }

    dispatchPromisedNotificationsEvent(promise, events, errorHandler);

    return promise.then(
        (data) => [data, null],
        (error) => [null, error],
    );
};
