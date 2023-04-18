import { useEffect } from 'react';
import toast from 'react-hot-toast';

import type { NotificationsEventPromiseData } from '../../utils/dispatchNotification';

import { tr } from './NotificationsHub.i18n';

declare global {
    interface WindowEventMap {
        notifyPromise: CustomEvent;
    }
}

const NotificationsHub: React.FC = () => {
    const promiseListener = async (e: CustomEvent<NotificationsEventPromiseData>) => {
        const id = toast.loading(tr(e.detail.events.onPending));

        await e.detail.promise
            .then((data) => {
                toast.dismiss(id);
                toast.success(tr(e.detail.events.onSuccess));
                return [data, null];
            })
            .catch((error) => {
                toast.dismiss(id);
                toast.error(tr(e.detail.events.onError));
                return [null, error];
            });
    };

    useEffect(() => {
        window.addEventListener('notifyPromise', promiseListener);

        return () => {
            window.removeEventListener('notifyPromise', promiseListener);
        };
    }, []);

    return null;
};

export default NotificationsHub;
