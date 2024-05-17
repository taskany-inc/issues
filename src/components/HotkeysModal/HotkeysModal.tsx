import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Modal, ModalContent } from '@taskany/bricks';
import { Text, Keyboard } from '@taskany/bricks/harmony';

import { isEventTargetInputOrTextArea } from '../../utils/hotkeys';

import { tr } from './HotkeysModal.i18n';
import s from './HotkeysModal.module.css';

const HotkeysModal = () => {
    const [modalVisible, setModalVisibility] = useState(false);
    const timer = useRef<NodeJS.Timeout | null>();
    const isLongPress = useRef<boolean>(false);

    function startPressTimer() {
        isLongPress.current = false;
        timer.current = setTimeout(() => {
            isLongPress.current = true;
            setModalVisibility(true);
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
                <Text className={s.HotkeysTitle} size="xl" weight="bolder">
                    {tr('Available hotkeys')}
                </Text>

                <Text className={s.HotkeysDescription} size="m">
                    {tr('Any hotkey available on any page')}
                </Text>

                <div className={s.Hotkeys}>
                    <Text className={s.HotkeysRow}>
                        <Keyboard>c</Keyboard>, <Keyboard>p</Keyboard> — {tr('create project')}
                    </Text>
                    <Text className={s.HotkeysRow}>
                        <Keyboard>c</Keyboard>, <Keyboard>g</Keyboard> — {tr('create goal')}
                    </Text>
                    <Text className={s.HotkeysRow}>
                        <Keyboard>c</Keyboard>, <Keyboard>i</Keyboard> — {tr('create issue')}
                    </Text>
                    <Text className={s.HotkeysRow}>
                        <Keyboard>c</Keyboard>, <Keyboard>u</Keyboard> — {tr('invite user')}
                    </Text>
                    <Text className={s.HotkeysRow}>
                        <Keyboard>g</Keyboard>, <Keyboard>h</Keyboard> — {tr('home page')}
                    </Text>
                    <Text className={s.HotkeysRow}>
                        <Keyboard>g</Keyboard>, <Keyboard>g</Keyboard> — {tr('goals page')}
                    </Text>
                    <Text className={s.HotkeysRow}>
                        <Keyboard>h</Keyboard> — {tr('shows this instruction')}
                    </Text>
                </div>
            </ModalContent>
        </Modal>
    );
};

export default HotkeysModal;
