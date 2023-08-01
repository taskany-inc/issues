import { getNotificicationKeyMap, NotificationNamespaces } from '../components/NotificationsHub/NotificationHub.map';

import { NotificationsEventPromiseData, dispatchPromisedNotificationsEvent } from './dispatchNotification';

interface NotifyPromise {
    <T>(promise: Promise<T>, events: NotificationsEventPromiseData['events']): PromiseLike<[T, null] | [null, T]>;
    <T>(promise: Promise<T>, namespace: NotificationNamespaces): PromiseLike<[T, null] | [null, T]>;
}

export const notifyPromise: NotifyPromise = (promise, eventsOrNamespace) => {
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

    dispatchPromisedNotificationsEvent(promise, events);

    return promise.then(
        (data) => [data, null],
        (error) => [null, error],
    );
};
