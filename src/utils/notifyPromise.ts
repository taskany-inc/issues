import { getNotificicationKeyMap, NotificationNamespaces } from '../components/NotificationsHub/NotificationHub.map';

import { NotificationsEventPromiseData, dispatchPromisedNotificationsEvent } from './dispatchNotification';

interface NotifyPromise {
    <T>(promise: Promise<T>, events: NotificationsEventPromiseData['events']): PromiseLike<[T, null] | [null, T]>;
    <T>(promise: Promise<T>, namespace: NotificationNamespaces): PromiseLike<[T, null] | [null, T]>;
}

export const notifyPromise: NotifyPromise = (promise, eventsOrNamespace) => {
    let events: NotificationsEventPromiseData['events'];

    if (typeof eventsOrNamespace === 'string') {
        events = {
            onSuccess: getNotificicationKeyMap(eventsOrNamespace).success,
            onPending: getNotificicationKeyMap(eventsOrNamespace).pending,
            onError: getNotificicationKeyMap(eventsOrNamespace).error ?? getNotificicationKeyMap('error'),
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
