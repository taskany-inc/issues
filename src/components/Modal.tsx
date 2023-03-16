import React, { useEffect } from 'react';
import styled from 'styled-components';

import { useKeyboard, KeyCode } from '@common/hooks/useKeyboard';
import { nullable } from '@common/utils/nullable';

import { backgroundColor, danger0, gapM, gapS, gray4, radiusM, warn0 } from '../design/@generated/themes';

import { Icon } from './Icon';
import { Portal } from './Portal';

type ModalViewType = 'default' | 'warn' | 'danger';

const colorsMap: Record<ModalViewType, string> = {
    default: 'transparent',
    warn: warn0,
    danger: danger0,
};

interface ModalProps {
    children: React.ReactNode;

    visible?: boolean;
    width?: number;
    view?: ModalViewType;

    onClose?: () => void;
    onShow?: () => void;
}

const StyledModalSurface = styled.div`
    position: fixed;
    z-index: 101;
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

    min-width: 300px;
    min-height: 200px;
    max-height: 90%;

    border-radius: ${radiusM};

    background-color: ${backgroundColor};

    border: 1px solid ${({ view = 'default' }) => colorsMap[view]};
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

export const ModalCross: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
    <StyledCross onClick={onClick}>
        <Icon type="cross" size="s" />
    </StyledCross>
);

export const ModalHeader = styled.div`
    z-index: 2;

    background-color: ${gray4};
    --background-color-context: ${gray4};

    padding: ${gapM} ${gapM} ${gapS} ${gapM};

    border-top-left-radius: ${radiusM};
    border-top-right-radius: ${radiusM};
`;

export const ModalContent = styled.div`
    z-index: 1;

    padding: ${gapM};
`;

export const Modal: React.FC<ModalProps> = ({ visible, view, children, width = 800, onClose, onShow }) => {
    const [onESC] = useKeyboard([KeyCode.Escape], () => onClose?.(), {
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
        visible && onShow?.();
    }, [visible, onShow]);

    return (
        <>
            {nullable(visible, () => (
                <Portal id="modal">
                    <StyledModalSurface>
                        <StyledModal view={view} style={{ width: `${width}px` }} {...onESC}>
                            {nullable(onClose, () => (
                                <ModalCross onClick={onClose} />
                            ))}
                            {children}
                        </StyledModal>
                    </StyledModalSurface>
                </Portal>
            ))}
        </>
    );
};
