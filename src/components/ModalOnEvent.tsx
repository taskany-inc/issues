import { useCallback, useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

import { ModalEvent } from '../utils/dispatchModal';
import { createHotkeys } from '../utils/hotkeys';

import { Modal } from './Modal';

interface ModalOnEventProps {
    event: ModalEvent;
    children: React.ComponentProps<typeof Modal>['children'];
    hotkeys?: string[];
    visible?: boolean;
    view?: React.ComponentProps<typeof Modal>['view'];

    onShow?: React.ComponentProps<typeof Modal>['onShow'];
    onClose?: React.ComponentProps<typeof Modal>['onClose'];
}

const ModalOnEvent: React.FC<ModalOnEventProps> = ({
    event,
    hotkeys,
    visible = false,
    view,
    children,
    onShow,
    onClose,
}) => {
    const [modalVisible, setModalVisibility] = useState(visible);
    const onModalClose = useCallback(() => {
        setModalVisibility(false);
        onClose?.();
    }, [setModalVisibility, onClose]);

    useEffect(() => {
        if (hotkeys) {
            tinykeys(window, createHotkeys([hotkeys, () => setModalVisibility(true)]));
        }
    }, [hotkeys]);

    useEffect(() => {
        setModalVisibility(visible);
    }, [visible]);

    useEffect(() => {
        const globalListener = () => {
            setModalVisibility(!modalVisible);
        };

        window.addEventListener(event, globalListener);

        return () => {
            window.removeEventListener(event, globalListener);
        };
    }, [event, modalVisible]);

    return (
        <Modal view={view} visible={modalVisible} onShow={onShow} onClose={onModalClose}>
            {children}
        </Modal>
    );
};

export default ModalOnEvent;
