import { useEffect } from 'react';
import toast from 'react-hot-toast';

import type { NotificationsEventPromiseData } from '../../utils/dispatchNotification';

import { I18nKey, tr } from './NotificationsHub.i18n';

declare global {
    interface WindowEventMap {
        notifyPromise: CustomEvent<NotificationsEventPromiseData>;
        notifyError: CustomEvent<NotificationsEventPromiseData>;
        notifySuccess: CustomEvent<NotificationsEventPromiseData>;
    }
}

const NotificationsHub: React.FC = () => {
    const promiseListener = async (e: WindowEventMap['notifyPromise']) => {
        const id = toast.loading(tr(e.detail.events.onPending as I18nKey));

        await e.detail.promise
            .then((data) => {
                toast.dismiss(id);
                toast.success(tr(e.detail.events.onSuccess as I18nKey));
                return [data, null];
            })
            .catch((error) => {
                toast.dismiss(id);
                const message =
                    (e.detail.errorHandler && e.detail.errorHandler(error)) ?? tr(e.detail.events.onError as I18nKey);

                toast.error(message);

                return [null, error];
            });
    };

    const notifyErrorHandler = (ev: WindowEventMap['notifyError']) => {
        if (ev.detail.events?.onError) toast.error(tr(ev.detail.events.onError as I18nKey));
    };

    const notifySuccessHandler = (ev: WindowEventMap['notifySuccess']) => {
        if (ev.detail.events?.onSuccess) toast.success(tr(ev.detail.events.onSuccess as I18nKey));
    };

    useEffect(() => {
        window.addEventListener('notifyPromise', promiseListener);
        window.addEventListener('notifyError', notifyErrorHandler);
        window.addEventListener('notifySuccess', notifySuccessHandler);

        return () => {
            window.removeEventListener('notifyPromise', promiseListener);
            window.removeEventListener('notifyError', notifyErrorHandler);
            window.removeEventListener('notifySuccess', notifySuccessHandler);
        };
    }, []);

    return null;
};

export default NotificationsHub;
