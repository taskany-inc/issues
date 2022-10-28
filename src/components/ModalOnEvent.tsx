import { useCallback, useEffect, useState, createContext } from 'react';
import tinykeys from 'tinykeys';

import { ModalEvent } from '../utils/dispatchModal';
import { createHotkeys } from '../utils/hotkeys';

import { Modal } from './Modal';

interface ModalOnEventProps {
    event: ModalEvent;
    hotkeys?: string[];
    visible?: boolean;
    view?: React.ComponentProps<typeof Modal>['view'];
    children: React.ComponentProps<typeof Modal>['children'];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const modalOnEventContext = createContext<any>(undefined);

const ModalOnEvent: React.FC<ModalOnEventProps> = ({ event, hotkeys, visible = false, view, children }) => {
    const [modalVisible, setModalVisibility] = useState(visible);
    const [modalContextProps, setModalContextProps] = useState(null);
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => {
        if (hotkeys) {
            tinykeys(window, createHotkeys([hotkeys, () => setModalVisibility(true)]));
        }
    }, [hotkeys]);

    const globalListener = useCallback(
        (e: CustomEvent) => {
            setModalVisibility(!modalVisible);
            setModalContextProps(e.detail);
        },
        [modalVisible],
    );
    useEffect(() => {
        // @ts-ignore EventListener doesn't work with CustomEvent type ¯\_(ツ)_/¯
        window.addEventListener(event, globalListener);

        return () => {
            // @ts-ignore EventListener doesn't work with CustomEvent type ¯\_(ツ)_/¯
            window.removeEventListener(event, globalListener);
        };
    }, [event, globalListener]);

    return (
        <Modal view={view} visible={modalVisible} onClose={onModalClose}>
            <modalOnEventContext.Provider value={modalContextProps}>{children}</modalOnEventContext.Provider>
        </Modal>
    );
};

export default ModalOnEvent;
