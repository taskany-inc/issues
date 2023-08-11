import React from 'react';
import { ModalContent } from '@taskany/bricks';
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
`;
const ImageFullScreen: React.FC<ImageFullScreenProps> = ({ src = '', alt = '' }) => {
    return (
        <ModalContent>
            <StyledWrapperImage>
                <StyledImage src={src} alt={alt} onClick={dispatchModalEvent(ModalEvent.ImageFullScreen)} />
            </StyledWrapperImage>
        </ModalContent>
    );
};

export default ImageFullScreen;
