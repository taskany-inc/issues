import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { gray8, gapM, gray9, gapS } from '@taskany/colors';
import { Modal, ModalContent, Text } from '@taskany/bricks';

import { isEventTargetInputOrTextArea } from '../../utils/hotkeys';
import { Keyboard } from '../Keyboard';

import { tr } from './HotkeysModal.i18n';

const StyledHotkeys = styled.div`
    padding: ${gapM} 0;
    display: grid;
    grid-template-columns: 6fr 6fr;
    align-items: center;
    justify-content: start;
`;

const StyledTitle = styled(Text)`
    padding-bottom: ${gapS};
`;

const StyledHotkeyRow = styled(Text)`
    padding-top: ${gapM};
`;

const HotkeysModal = () => {
    const [modalVisible, setModalVisibility] = useState(false);
    const timer = useRef<NodeJS.Timeout | null>();
    const isLongPress = useRef<boolean>(false);
    const [action, setAction] = useState<'shortpress' | 'longpress'>('shortpress');

    function startPressTimer() {
        isLongPress.current = false;
        setAction('shortpress');
        timer.current = setTimeout(() => {
            isLongPress.current = true;
            setAction('longpress');
        }, 500);
    }

    const keydownListener = useCallback((e: KeyboardEvent) => {
        if (!isEventTargetInputOrTextArea(e.target) && e.code === 'KeyH' && !timer.current) {
            startPressTimer();
        }
    }, []);

    const keyupListener = useCallback(() => {
        clearTimeout(Number(timer.current));
        timer.current = null;
        setModalVisibility(false);
    }, []);

    useEffect(() => {
        if (action === 'longpress') {
            setModalVisibility(true);
        }
    }, [action]);

    useEffect(() => {
        window.addEventListener('keydown', keydownListener, true);
        return () => window.removeEventListener('keydown', keydownListener, true);
    }, [keydownListener]);

    useEffect(() => {
        window.addEventListener('keyup', keyupListener, true);
        return () => window.removeEventListener('keyup', keyupListener, true);
    }, [keyupListener]);

    return (
        <Modal visible={modalVisible}>
            <ModalContent>
                <StyledTitle size="xl" weight="bolder">
                    {tr('Available hotkeys')}
                </StyledTitle>

                <Text size="m" color={gray8}>
                    {tr('Any hotkey available on any page')}
                </Text>

                <StyledHotkeys>
                    <StyledHotkeyRow color={gray9}>
                        <Keyboard>c</Keyboard>, <Keyboard>p</Keyboard> — {tr('create project')}
                    </StyledHotkeyRow>
                    <StyledHotkeyRow color={gray9}>
                        <Keyboard>c</Keyboard>, <Keyboard>g</Keyboard> — {tr('create goal')}
                    </StyledHotkeyRow>
                    <StyledHotkeyRow color={gray9}>
                        <Keyboard>c</Keyboard>, <Keyboard>i</Keyboard> — {tr('create issue')}
                    </StyledHotkeyRow>
                    <StyledHotkeyRow color={gray9}>
                        <Keyboard>c</Keyboard>, <Keyboard>u</Keyboard> — {tr('invite user')}
                    </StyledHotkeyRow>
                    <StyledHotkeyRow color={gray9}>
                        <Keyboard>g</Keyboard>, <Keyboard>h</Keyboard> — {tr('home page')}
                    </StyledHotkeyRow>
                    <StyledHotkeyRow color={gray9}>
                        <Keyboard>g</Keyboard>, <Keyboard>g</Keyboard> — {tr('goals page')}
                    </StyledHotkeyRow>
                    <StyledHotkeyRow color={gray9}>
                        <Keyboard>h</Keyboard> — {tr('shows this instruction')}
                    </StyledHotkeyRow>
                </StyledHotkeys>
            </ModalContent>
        </Modal>
    );
};

export default HotkeysModal;
