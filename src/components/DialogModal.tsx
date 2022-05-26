import React from 'react';
import styled from 'styled-components';
import { Modal } from '@geist-ui/core';

import { Icon } from './Icon';

interface DialogModalProps {
    visible?: React.ComponentProps<typeof Modal>['visible'];
    onClose?: React.ComponentProps<typeof Modal>['onClose'];
}

const StyledCross = styled.div`
    position: absolute;
    width: 20px;
    height: 20px;
    right: 20px;
    top: 12px;
    opacity: 0.6;
    cursor: pointer;

    &:hover {
        opacity: 1;
        transisiton: opacity 200ms easy;
    }
`;

export const DialogModal: React.FC<DialogModalProps> = ({ children, visible, onClose }) => {
    return (
        <Modal visible={visible} onClose={onClose} width="800px" keyboard disableBackdropClick>
            <StyledCross onClick={onClose}>
                <Icon type="cross" size="s" />
            </StyledCross>
            <Modal.Content style={{ paddingTop: 0, paddingBottom: 0 }}>{children}</Modal.Content>
        </Modal>
    );
};
