import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

import { backgroundColor, radiusM } from '../design/@generated/themes';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { usePortal } from '../hooks/usePortal';
import { nullable } from '../utils/nullable';

import { Icon } from './Icon';

interface ModalProps {
    visible: boolean;
    width?: number;

    onClose?: () => void;
}

const StyledModalSurface = styled.div`
    position: fixed;
    z-index: 100;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    display: flex;
    justify-content: center;
    align-items: center;

    width: 100%;
    height: 100%;

    background-color: rgba(0, 0, 0, 0.5);
`;

const StyledModal = styled.div`
    box-sizing: border-box;
    position: absolute;
    z-index: 101;

    padding: 20px;

    min-width: 300px;
    min-height: 300px;

    border-radius: ${radiusM};

    background-color: ${backgroundColor};
`;

const StyledCross = styled.div`
    position: absolute;
    z-index: 102;
    width: 20px;
    height: 20px;
    right: 20px;
    top: 12px;
    opacity: 0.6;
    cursor: pointer;

    &:hover {
        opacity: 1;
        transition: opacity 200ms ease-in-out;
    }
`;

const Portal: React.FC<{ id: string }> = ({ id, children }) => createPortal(children, usePortal(id));

export const Modal: React.FC<ModalProps> = ({ visible, onClose, children, width = 800 }) => {
    const [onESC] = useKeyboard([KeyCode.Escape], () => onClose && onClose(), {
        stopPropagation: true,
    });

    useEffect(() => {
        if (visible) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [visible]);

    return (
        <>
            {nullable(visible, () => (
                <Portal id="modal">
                    <StyledModalSurface>
                        <StyledModal style={{ width: `${width}px` }} {...onESC}>
                            <StyledCross onClick={onClose}>
                                <Icon type="cross" size="s" />
                            </StyledCross>
                            {children}
                        </StyledModal>
                    </StyledModalSurface>
                </Portal>
            ))}
        </>
    );
};
