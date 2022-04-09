import React from 'react';
import styled from 'styled-components';
import { Modal, Text } from '@geist-ui/core';

import { Icon } from './Icon';

interface DialogModalProps {
    heading?: string;
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

export const DialogModal: React.FC<DialogModalProps> = ({ heading, children, visible, onClose }) => {
    return (
        <Modal visible={visible} onClose={onClose} width="800px" keyboard disableBackdropClick>
            <StyledCross onClick={onClose}>
                <Icon type="cross" size="s" />
            </StyledCross>
            <Modal.Content>
                {heading && <Text h1>{heading}</Text>}
                {children}
            </Modal.Content>
        </Modal>
    );
};
