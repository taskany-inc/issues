import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import type { EmojiSelection, EmojiPicker } from 'picmo';
import dynamic from 'next/dynamic';

import { PageContext } from '../utils/pageContext';
import { backgroundColor, gray3, gray4, gray6, gray7, gray8, textColor } from '../design/@generated/themes';
import { usePageContext } from '../hooks/usePageContext';

import { Icon } from './Icon';
import { ReactionsButton } from './ReactionsButton';

const Popup = dynamic(() => import('@common/Popup'));

interface ReactionsDropdownProps {
    view?: 'button' | 'icon';

    onClick?: (emoji?: string) => void;
}

const StyledPicker = styled.div`
    .taskany-picker {
        --background-color: ${backgroundColor};
        --secondary-background-color: ${backgroundColor};
        --border-color: transparent;
        --category-name-background-color: ${backgroundColor};
        --category-name-text-color: ${gray8};
        --hover-background-color: ${gray6};
        --focus-indicator-color: ${gray6};
        --focus-indicator-background-color: ${gray6};
        --text-color: ${textColor};
        --search-background-color: ${gray4};
        --search-focus-background-color: ${gray3};
        --search-placeholder-color: ${gray7};
        --search-icon-color: ${gray7};
    }
`;

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
                    className: 'taskany-picker',
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
        icon: <Icon ref={buttonRef} noWrap type="emoji" size="xs" onClick={onButtonClick} />,
    };

    return (
        <>
            <span ref={popupRef}>{viewModeMap[view]}</span>

            <Popup
                placement="right"
                overflow="hidden"
                visible={popupVisible}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={280}
                offset={[0, 4]}
            >
                <StyledPicker ref={rootElement} />
            </Popup>
        </>
    );
};

export default ReactionsDropdown;
