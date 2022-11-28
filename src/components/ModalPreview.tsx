import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

import { backgroundColor, gapM, radiusM } from '../design/@generated/themes';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { usePortal } from '../hooks/usePortal';
import { nullable } from '../utils/nullable';

import { Icon } from './Icon';

interface ModalPreviewProps {
    children: React.ReactNode;

    visible?: boolean;
    width?: number;

    onClose?: () => void;
    onShow?: () => void;
}

const StyledModal = styled.div`
    box-sizing: border-box;
    position: fixed;
    z-index: 101;
    right: ${gapM};
    top: ${gapM};
    bottom: ${gapM};

    overflow: hidden;

    min-width: 300px;
    width: 700px;
    min-height: 95%;

    border-radius: ${radiusM};

    background-color: ${backgroundColor};

    box-shadow: -10px 0px 20px 15px rgb(0 0 0 / 30%);
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

interface PortalProps {
    id: string;
    children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ id, children }) => createPortal(children, usePortal(id));

export const ModalPreview: React.FC<ModalPreviewProps> = ({ visible, children, onClose, onShow }) => {
    const [focused, setFocused] = useState(false);

    const [onESC] = useKeyboard([KeyCode.Escape], () => onClose?.(), {
        disableGlobalEvent: false,
    });

    const onMouseEnter = useCallback(() => {
        setFocused(true);
    }, []);

    const onMouseLeave = useCallback(() => {
        setFocused(false);
    }, []);

    useEffect(() => {
        if (visible) {
            document.body.style.overflow = focused ? 'hidden' : 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [visible, focused]);

    useEffect(() => {
        visible && onShow?.();
    }, [visible, onShow]);

    return (
        <>
            {nullable(visible, () => (
                <Portal id="modalPreview">
                    <StyledModal onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} {...onESC}>
                        {nullable(onClose, () => (
                            <StyledCross onClick={onClose}>
                                <Icon type="cross" size="s" />
                            </StyledCross>
                        ))}
                        {children}
                    </StyledModal>
                </Portal>
            ))}
        </>
    );
};
