import { MapModalToComponentProps, ModalEvent } from './utils/dispatchModal';

declare global {
    interface Window {
        addEventListener<K extends ModalEvent>(
            type: K,
            listener: (this: Window, ev: CustomEvent<MapModalToComponentProps[K]>) => void,
            opts?: boolean | AddEventListenerOptions,
        ): void;
        removeEventListener<K extends ModalEvent>(
            type: K,
            listener: (this: Window, ev: CustomEvent<MapModalToComponentProps[K]>) => void,
            opts?: boolean | EventListenerOptions,
        ): void;
    }

    interface Document {
        addEventListener<K extends ModalEvent>(
            type: K,
            listener: (this: Window, ev: CustomEvent<MapModalToComponentProps[K]>) => void,
            opts?: boolean | AddEventListenerOptions,
        ): void;
        removeEventListener<K extends ModalEvent>(
            type: K,
            listener: (this: Window, ev: CustomEvent<MapModalToComponentProps[K]>) => void,
            opts?: boolean | EventListenerOptions,
        ): void;
    }
}
