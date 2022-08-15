import { useCallback, useEffect, useState } from 'react';

import { ModalEvent } from '../utils/dispatchModal';

import { Modal } from './Modal';

interface ModalOnEventProps {
    event: ModalEvent;
}

const ModalOnEvent: React.FC<ModalOnEventProps> = ({ event, children }) => {
    const [modalVisible, setModalVisibility] = useState(false);
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

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
