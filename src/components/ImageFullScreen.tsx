import React, { useEffect, useRef } from 'react';
import { KeyCode, ModalContent, useClickOutside, useKeyboard } from '@taskany/bricks';
import styled from 'styled-components';

import { ModalEvent, dispatchModalEvent } from '../utils/dispatchModal';

interface ImageFullScreenProps {
    src?: string;
    alt?: string;
}
const StyledImage = styled.img`
    cursor: pointer;
    width: 100vh;
`;
const StyledWrapperImage = styled.div`
    display: flex;
    justify-content: center;
    outline: none;
`;
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
            <StyledWrapperImage ref={ref} tabIndex={1} {...onESC}>
                <StyledImage src={src} alt={alt} onClick={dispatchModalEvent(ModalEvent.ImageFullScreen)} />
            </StyledWrapperImage>
        </ModalContent>
    );
};

export default ImageFullScreen;
