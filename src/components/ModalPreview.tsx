import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { backgroundColor, gapM, radiusM } from '@taskany/colors';

import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { nullable } from '../utils/nullable';

import { ModalCross } from './Modal';
import { Portal } from './Portal';

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
    z-index: 100;
    right: ${gapM};
    top: ${gapM};
    bottom: ${gapM};

    overflow: hidden;

    min-width: 300px;
    width: 700px;
    min-height: 95%;

    border-radius: ${radiusM};

    background-color: ${backgroundColor};

    box-shadow: -10px 0px 25px 10px rgb(0 0 0 / 15%);
`;

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
                            <ModalCross onClick={onClose} />
                        ))}
                        {children}
                    </StyledModal>
                </Portal>
            ))}
        </>
    );
};
