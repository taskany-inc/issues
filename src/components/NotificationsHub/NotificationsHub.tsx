import { useEffect } from 'react';
import toast from 'react-hot-toast';

import type { NotificationsEventPromiseData } from '../../utils/dispatchNotification';

declare global {
    interface WindowEventMap {
        notifyPromise: CustomEvent<NotificationsEventPromiseData>;
        notifyError: CustomEvent<string>;
        notifySuccess: CustomEvent<string>;
    }
}

const NotificationsHub: React.FC = () => {
    const promiseListener = async (e: WindowEventMap['notifyPromise']) => {
        const id = toast.loading(e.detail.events.onPending);

        await e.detail.promise
            .then((data) => {
                toast.dismiss(id);
                toast.success(e.detail.events.onSuccess);
                return [data, null];
            })
            .catch((error) => {
                toast.dismiss(id);
                toast.error(e.detail.events.onError);
                return [null, error];
            });
    };

    const notifyErrorHandler = (ev: WindowEventMap['notifyError']) => {
        toast.error(ev.detail);
    };

    const notifySuccessHandler = (ev: WindowEventMap['notifySuccess']) => {
        toast.success(ev.detail);
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
