import React, { useEffect, useRef } from 'react';
import { KeyCode, ModalContent, useClickOutside, useKeyboard } from '@taskany/bricks';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';

import s from './ImageFullScreen.module.css';

interface ImageFullScreenProps {
    src?: string;
    alt?: string;
}

const ImageFullScreen: React.FC<ImageFullScreenProps> = ({ src = '', alt = '' }) => {
    const ref = useRef<HTMLDivElement>(null);

    useClickOutside(ref, () => {
        dispatchModalEvent(ModalEvent.ImageFullScreen)();
    });

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        dispatchModalEvent(ModalEvent.ImageFullScreen)();
    });

    useEffect(() => {
        setTimeout(() => ref.current?.focus(), 0);
    });

    return (
        <ModalContent>
            <div className={s.ImageWrapper} ref={ref} tabIndex={1} {...onESC}>
                <img className={s.Image} src={src} alt={alt} onClick={dispatchModalEvent(ModalEvent.ImageFullScreen)} />
            </div>
        </ModalContent>
    );
};

export default ImageFullScreen;
