import { useCallback, useEffect, useState, createContext } from 'react';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const modalOnEventContext = createContext<any>(undefined);

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
    const [modalContextProps, setModalContextProps] = useState(null);
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
        const globalListener = (e: CustomEvent) => {
            setModalVisibility(!modalVisible);
            setModalContextProps(e.detail);
        };

        // @ts-ignore EventListener doesn't work with CustomEvent type ¯\_(ツ)_/¯
        window.addEventListener(event, globalListener);

        return () => {
            // @ts-ignore EventListener doesn't work with CustomEvent type ¯\_(ツ)_/¯
            window.removeEventListener(event, globalListener);
        };
    }, [event, modalVisible]);

    return (
        <Modal view={view} visible={modalVisible} onShow={onShow} onClose={onModalClose}>
            <modalOnEventContext.Provider value={modalContextProps}>{children}</modalOnEventContext.Provider>
        </Modal>
    );
};

export default ModalOnEvent;
