import { NotificationsEventPromiseData, dispatchPromisedNotificationsEvent } from './dispatchNotification';

export const notifyPromise = <T>(promise: Promise<T>, events: NotificationsEventPromiseData['events']) => {
    dispatchPromisedNotificationsEvent(promise, events);
    return promise.then((data) => [data, null]).catch((error) => [null, error]) as Promise<[T | null, Error | null]>;
};
