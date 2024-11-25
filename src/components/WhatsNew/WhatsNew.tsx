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
    const utils = trpc.useContext();
    const [iframeReady, setIframeReady] = useState(false);

    const { data } = trpc.whatsnew.check.useQuery(
        {
            locale,
        },
        {
            staleTime: Infinity,
            trpc: {
                context: {
                    skipBatch: true,
                },
            },
        },
    );

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
            utils.whatsnew.check.invalidate();
            dispatchModalEvent(ModalEvent.WhatsNewModal)();
        }
    }, [data?.version, markAsReadMutation, utils.whatsnew.check]);

    const markAsDelayedMutation = trpc.whatsnew.markAsDelayed.useMutation();
    const onDelayClick = useCallback(async () => {
        if (data?.version) {
            await markAsDelayedMutation.mutateAsync({
                version: data.version,
            });
            utils.whatsnew.check.invalidate();
            dispatchModalEvent(ModalEvent.WhatsNewModal)();
        }
    }, [data?.version, markAsDelayedMutation, utils.whatsnew.check]);

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
