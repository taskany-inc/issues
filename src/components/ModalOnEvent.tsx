import { useCallback, useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

import { ModalEvent } from '../utils/dispatchModal';
import { createHotkeys } from '../utils/hotkeys';

import { Modal } from './Modal';

interface ModalOnEventProps {
    event: ModalEvent;
    hotkeys?: string[];
    visible?: boolean;
}

const ModalOnEvent: React.FC<ModalOnEventProps> = ({ event, hotkeys, visible = false, children }) => {
    const [modalVisible, setModalVisibility] = useState(visible);
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => {
        if (hotkeys) {
            tinykeys(window, createHotkeys([hotkeys, () => setModalVisibility(true)]));
        }
    }, [hotkeys]);

    const globalListener = () => setModalVisibility(true);
    useEffect(() => {
        window.addEventListener(event, globalListener);

        return () => {
            window.removeEventListener(event, globalListener);
        };
    }, [event]);

    return (
        <Modal visible={modalVisible} onClose={onModalClose}>
            {children}
        </Modal>
    );
};

export default ModalOnEvent;
