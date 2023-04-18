import type { I18nKey } from '../components/NotificationsHub/NotificationsHub.i18n';

export const dispatchNotificationsEvent = (key: I18nKey) => () => {
    window.dispatchEvent(new CustomEvent('notify', { detail: key }));
};

export interface NotificationsEventPromiseData {
    promise: Promise<unknown>;
    events: {
        onPending: I18nKey;
        onSuccess: I18nKey;
        onError: I18nKey;
    };
}

export const dispatchPromisedNotificationsEvent = (
    promise: NotificationsEventPromiseData['promise'],
    events: NotificationsEventPromiseData['events'],
) => {
    window.dispatchEvent(new CustomEvent('notifyPromise', { detail: { promise, events } }));
};
