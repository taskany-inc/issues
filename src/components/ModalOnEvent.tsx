import { useCallback, useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

import { ModalEvent } from '../utils/dispatchModal';
import { createHotkeys } from '../utils/hotkeys';

import { Modal } from './Modal';

interface ModalOnEventProps {
    event: ModalEvent;
    hotkeys?: string[];
    visible?: boolean;
    view?: React.ComponentProps<typeof Modal>['view'];
}

const ModalOnEvent: React.FC<ModalOnEventProps> = ({ event, hotkeys, visible = false, view, children }) => {
    const [modalVisible, setModalVisibility] = useState(visible);
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => {
        if (hotkeys) {
            tinykeys(window, createHotkeys([hotkeys, () => setModalVisibility(true)]));
        }
    }, [hotkeys]);

    const globalListener = useCallback(() => setModalVisibility(!modalVisible), [modalVisible]);
    useEffect(() => {
        window.addEventListener(event, globalListener);

        return () => {
            window.removeEventListener(event, globalListener);
        };
    }, [event, globalListener]);

    return (
        <Modal view={view} visible={modalVisible} onClose={onModalClose}>
            {children}
        </Modal>
    );
};

export default ModalOnEvent;
