import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { createPicker, EmojiPicker, NativeRenderer, darkTheme, lightTheme, EmojiSelection } from 'picmo';

import { pageContext, PageContext } from '../utils/pageContext';
import { backgroundColor, gray3, gray4, gray6, gray7, gray8, textColor } from '../design/@generated/themes';

import { Popup } from './Popup';
import { ReactionsButton } from './ReactionsButton';

interface ReactionsDropdownProps {
    emoji?: React.ComponentProps<typeof ReactionsButton>['emoji'];

    onClick?: (emoji: string) => void;
}

const mapThemeOnPicmoTheme: Record<NonNullable<PageContext['theme']>, string> = {
    dark: darkTheme,
    light: lightTheme,
};

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

export const ReactionsDropdown = ({ emoji, onClick }: ReactionsDropdownProps) => {
    const { theme } = useContext(pageContext);
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const rootElement = useRef<HTMLDivElement>(null);
    const picker = useRef<EmojiPicker>();
    const [selectedEmoji, setSelectedEmoji] = useState(emoji);

    const listener = useCallback(
        (selection: EmojiSelection) => {
            setSelectedEmoji(selection.emoji);
            onClick && onClick(selection.emoji);
        },
        [onClick],
    );

    useEffect(() => {
        if (popupVisible && rootElement.current && theme) {
            picker.current = createPicker({
                rootElement: rootElement.current,
                className: 'taskany-picker',
                theme: mapThemeOnPicmoTheme[theme],
                renderer: new NativeRenderer(),
                emojiSize: '20px',
                visibleRows: 4,
                showPreview: false,
                showCategoryTabs: false,
            });

            picker.current.addEventListener('emoji:select', listener);
        }

        return () => {
            if (picker.current) {
                picker.current.removeEventListener('emoji:select', listener);
            }
        };
    }, [rootElement, theme, listener, popupVisible]);

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(!popupVisible);
    }, [popupVisible]);

    return (
        <>
            <span ref={popupRef}>
                <ReactionsButton ref={buttonRef} emoji={selectedEmoji} onClick={onButtonClick} />
            </span>

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
