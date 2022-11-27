import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';

import { backgroundColor, danger0, gapM, gapS, gray3, gray4, radiusM, warn0 } from '../design/@generated/themes';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { usePortal } from '../hooks/usePortal';
import { nullable } from '../utils/nullable';

import { Icon } from './Icon';

type ModalViewType = 'default' | 'warn' | 'danger';

const colorsMap: Record<ModalViewType, string> = {
    default: 'transparent',
    warn: warn0,
    danger: danger0,
};

interface ModalProps {
    visible: boolean;
    width?: number;
    view?: ModalViewType;
    children: React.ReactNode;

    onClose?: () => void;
    onShow?: () => void;
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

    background-color: rgba(0, 0, 0, 0.9);
`;

const StyledModal = styled.div<{ view?: ModalViewType }>`
    box-sizing: border-box;
    position: absolute;
    z-index: 101;

    overflow: hidden;

    min-width: 300px;
    min-height: 200px;

    border-radius: ${radiusM};

    background-color: ${backgroundColor};

    ${({ view = 'default' }) => css`
        border: 1px solid ${colorsMap[view]};
    `}
`;

const StyledCross = styled.div`
    position: absolute;
    z-index: 102;
    right: ${gapM};
    top: ${gapM};

    width: 20px;
    height: 20px;

    opacity: 0.6;

    cursor: pointer;

    text-align: center;

    &:hover {
        opacity: 1;
        transition: opacity 200ms ease-in-out;
    }
`;

export const ModalHeader = styled.div`
    background-color: ${gray4};
    padding: ${gapM} ${gapM} ${gapS} ${gapM};
`;

export const ModalContent = styled.div`
    padding: ${gapM};
`;

interface PortalProps {
    id: string;
    children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ id, children }) => createPortal(children, usePortal(id));

export const Modal: React.FC<ModalProps> = ({ visible, view, children, width = 800, onClose, onShow }) => {
    const [onESC] = useKeyboard([KeyCode.Escape], () => onClose && onClose(), {
        disableGlobalEvent: false,
    });

    useEffect(() => {
        if (visible) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [visible]);

    useEffect(() => {
        if (visible) {
            onShow && onShow();
        }
    }, [visible, onShow]);

    return (
        <>
            {nullable(visible, () => (
                <Portal id="modal">
                    <StyledModalSurface>
                        <StyledModal view={view} style={{ width: `${width}px` }} {...onESC}>
                            {nullable(onClose, () => (
                                <StyledCross onClick={onClose}>
                                    <Icon type="cross" size="s" />
                                </StyledCross>
                            ))}
                            {children}
                        </StyledModal>
                    </StyledModalSurface>
                </Portal>
            ))}
        </>
    );
};
