import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { EmojiSelection, EmojiPicker } from 'picmo';
import { Popup } from '@taskany/bricks/harmony';
import { IconMoodTongueOutline } from '@taskany/icons';

import { PageContext } from '../../utils/pageContext';
import { usePageContext } from '../../hooks/usePageContext';
import { ReactionsButton } from '../ReactionsButton';

import s from './ReactionsDropdown.module.css';

interface ReactionsDropdownProps {
    view?: 'button' | 'icon';

    onClick?: (emoji?: string) => void;
}

const ReactionsDropdown = ({ view = 'button', onClick }: ReactionsDropdownProps) => {
    const { theme } = usePageContext();
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const rootElement = useRef<HTMLDivElement>(null);
    const picker = useRef<EmojiPicker>();
    const [picmo, setPicmo] = useState<typeof import('picmo')>();

    const listener = useCallback(
        (selection: EmojiSelection) => {
            setPopupVisibility(false);
            onClick && onClick(selection.emoji);
        },
        [onClick],
    );

    useEffect(() => {
        const loader = async () => {
            if (!picmo) {
                const picmoModule = await import('picmo');

                setPicmo(picmoModule);
            }

            if (picmo && popupVisible && rootElement.current && theme) {
                const mapThemeOnPicmoTheme: Record<NonNullable<PageContext['theme']>, string> = {
                    dark: picmo.darkTheme,
                    light: picmo.lightTheme,
                };

                picker.current = picmo.createPicker({
                    rootElement: rootElement.current,
                    className: s.Picker,
                    theme: mapThemeOnPicmoTheme[theme],
                    renderer: new picmo.NativeRenderer(),
                    emojiSize: '20px',
                    showPreview: false,
                    showCategoryTabs: false,
                });
            }

            if (picker.current) {
                picker.current.addEventListener('emoji:select', listener);
            }
        };

        loader();

        return () => {
            if (picker.current) {
                picker.current.removeEventListener('emoji:select', listener);
            }
        };
    }, [rootElement, theme, listener, popupVisible, picmo]);

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(!popupVisible);
    }, [popupVisible]);

    const viewModeMap: Record<'button' | 'icon', React.ReactNode> = {
        button: <ReactionsButton ref={buttonRef} onClick={onButtonClick} />,
        icon: <IconMoodTongueOutline size="xs" className={s.ReactionsIcon} ref={buttonRef} onClick={onButtonClick} />,
    };

    return (
        <>
            <span ref={popupRef}>{viewModeMap[view]}</span>

            <Popup
                placement="right"
                visible={popupVisible}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={280}
                offset={[0, 4]}
                className={s.ReactionsDropdownPopup}
            >
                <div ref={rootElement} />
            </Popup>
        </>
    );
};

export default ReactionsDropdown;
