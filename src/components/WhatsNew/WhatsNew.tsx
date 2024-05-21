import { useCallback, useEffect, useState } from 'react';
import { nullable } from '@taskany/bricks';
import dynamic from 'next/dynamic';
import { Button, ModalContent, ModalHeader } from '@taskany/bricks/harmony';
import cn from 'classnames';

import { routes } from '../../hooks/router';
import { useLocale } from '../../hooks/useLocale';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { trpc } from '../../utils/trpcClient';

import { tr } from './WhatsNew.i18n';
import s from './WhatsNew.module.css';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));

const WhatsNew = () => {
    const locale = useLocale();
    const [iframeReady, setIframeReady] = useState(false);

    const { data } = trpc.whatsnew.check.useQuery({
        locale,
    });

    useEffect(() => {
        if (data?.releaseNotesExists && data?.version && !data?.read && !data?.delayed) {
            dispatchModalEvent(ModalEvent.WhatsNewModal)();
        }
    }, [data]);

    const onIframeLoad = useCallback(() => {
        // TODO: show sausages
        setIframeReady(true);
    }, []);

    const markAsReadMutation = trpc.whatsnew.markAsRead.useMutation();
    const onReadClick = useCallback(async () => {
        if (data?.version) {
            await markAsReadMutation.mutateAsync({
                version: data.version,
            });

            dispatchModalEvent(ModalEvent.WhatsNewModal)();
        }
    }, [markAsReadMutation, data]);

    const markAsDelayedMutation = trpc.whatsnew.markAsDelayed.useMutation();
    const onDelayClick = useCallback(async () => {
        if (data?.version) {
            await markAsDelayedMutation.mutateAsync({
                version: data.version,
            });

            dispatchModalEvent(ModalEvent.WhatsNewModal)();
        }
    }, [markAsDelayedMutation, data]);

    return (
        <ModalOnEvent event={ModalEvent.WhatsNewModal}>
            <ModalHeader>{tr("What's New!")}</ModalHeader>
            <ModalContent>
                {nullable(data?.version, (v) => (
                    <iframe
                        className={cn(s.WhatsNewIframe, { [s.WhatsNewIframe_visible]: iframeReady })}
                        src={routes.whatsnew(v, locale)}
                        onLoad={onIframeLoad}
                    />
                ))}

                <div className={s.WhatsNewFooter}>
                    <Button text={tr('Dismiss')} onClick={onDelayClick} />
                    <Button view="primary" text={tr('Awesome! Thank you!')} onClick={onReadClick} />
                </div>
            </ModalContent>
        </ModalOnEvent>
    );
};

export default WhatsNew;
