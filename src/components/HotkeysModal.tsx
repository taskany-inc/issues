import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';

import { gray8, gapM, gray9, gapS } from '../design/@generated/themes';

import { Text } from './Text';
import { Modal } from './Modal';
import { Keyboard } from './Keyboard';

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
    const t = useTranslations('HotkeysModal');
    const [modalVisible, setModalVisibility] = useState(false);
    const timer = useRef<NodeJS.Timeout | null>();
    const keydownListener = useCallback((e: KeyboardEvent) => {
        if (e.code === 'KeyH' && !timer.current) {
            timer.current = setTimeout(() => {
                setModalVisibility(true);
            }, 200);
        }
    }, []);
    const keyupListener = useCallback(() => {
        timer.current = setTimeout(() => {
            clearTimeout(Number(timer.current));
            timer.current = null;
            setModalVisibility(false);
        }, 50);
    }, []);

    useEffect(() => () => clearTimeout(Number(timer.current)), []);

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
            <StyledTitle size="xl" weight="bolder">
                {t('Available hotkeys')}
            </StyledTitle>

            <Text size="m" color={gray8}>
                {t('Any hotkey available on any page')}
            </Text>

            <StyledHotkeys>
                <StyledHotkeyRow color={gray9}>
                    <Keyboard>c</Keyboard>, <Keyboard>p</Keyboard> — {t('create project')}
                </StyledHotkeyRow>
                <StyledHotkeyRow color={gray9}>
                    <Keyboard>c</Keyboard>, <Keyboard>g</Keyboard> — {t('create goal')}
                </StyledHotkeyRow>
                <StyledHotkeyRow color={gray9}>
                    <Keyboard>c</Keyboard>, <Keyboard>i</Keyboard> — {t('create issue')}
                </StyledHotkeyRow>
                <StyledHotkeyRow color={gray9}>
                    <Keyboard>c</Keyboard>, <Keyboard>u</Keyboard> — {t('invite user')}
                </StyledHotkeyRow>
                <StyledHotkeyRow color={gray9}>
                    <Keyboard>g</Keyboard>, <Keyboard>h</Keyboard> — {t('home page')}
                </StyledHotkeyRow>
                <StyledHotkeyRow color={gray9}>
                    <Keyboard>h</Keyboard> — {t('shows this instruction')}
                </StyledHotkeyRow>
            </StyledHotkeys>
        </Modal>
    );
};

export default HotkeysModal;
