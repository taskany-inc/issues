/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode, KeyboardEvents } from '../hooks/useKeyboard';
import { danger10 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

const Popup = dynamic(() => import('./Popup'));

interface ComboBoxTriggerProps {
    text: ComboBoxProps['text'];
    value: ComboBoxProps['value'];
    ref: React.RefObject<HTMLButtonElement>;
    disabled?: boolean;

    onClick: () => void;
}

interface ComboBoxInputProps extends Record<KeyboardEvents, React.KeyboardEventHandler<Element>> {
    value: string;
    ref: React.RefObject<HTMLInputElement>;
    disabled?: boolean;
}

interface ComboBoxItemProps {
    item: any;
    index: number;
    cursor: number;

    onClick: (value?: any) => void;
}

interface ComboBoxProps {
    renderInput: (props: ComboBoxInputProps) => React.ReactNode;
    renderItem: (props: ComboBoxItemProps) => React.ReactNode;
    renderTrigger?: (props: ComboBoxTriggerProps) => React.ReactNode;
    renderItems?: (children: React.ReactNode) => React.ReactNode;
    text?: string;
    value?: any;
    items?: any[];
    visible?: boolean;
    disabled?: boolean;
    error?: {
        message?: string;
    };
    maxWidth?: React.ComponentProps<typeof Popup>['maxWidth'];
    minWidth?: React.ComponentProps<typeof Popup>['minWidth'];

    onChange?: (value: any) => void;
}

const StyledComboBox = styled.span`
    position: relative;
`;

const StyledErrorTrigger = styled.div`
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 100%;
    background-color: ${danger10};
    top: 11px;
    left: -2px;
    z-index: 1;
`;

const ComboBox = React.forwardRef<HTMLDivElement, ComboBoxProps>(
    (
        {
            text,
            value,
            visible = false,
            items = [],
            disabled,
            error,
            maxWidth = 250,
            minWidth = 150,
            renderItem,
            renderTrigger,
            renderInput,
            onChange,
            renderItems,
        },
        ref,
    ) => {
        const popupRef = useRef<HTMLDivElement>(null);
        const buttonRef = useRef<HTMLButtonElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);
        const [popupVisible, setPopupVisibility] = useState(visible);
        const [editMode, setEditMode] = useState(false);
        const downPress = useKeyPress('ArrowDown');
        const upPress = useKeyPress('ArrowUp');
        const [cursor, setCursor] = useState(0);

        useEffect(() => {
            setPopupVisibility(visible);
        }, [visible]);

        useEffect(() => {
            if (renderTrigger) {
                setPopupVisibility(editMode);
            }
        }, [renderTrigger, editMode]);

        const onClickOutside = useCallback(() => {
            setEditMode(false);
        }, []);

        const onTriggerClick = useCallback(() => {
            setEditMode(true);
        }, []);

        const onItemClick = useCallback(
            (value: any) => () => {
                setEditMode(false);
                onChange?.(value);
            },
            [onChange],
        );

        const [onESC] = useKeyboard([KeyCode.Escape], () => {
            setEditMode(false);
        });

        const [onENTER] = useKeyboard([KeyCode.Enter], () => {
            onItemClick(items[cursor])();
        });

        useEffect(() => {
            if (items.length && downPress) {
                setCursor((prevState) => (prevState < items.length - 1 ? prevState + 1 : prevState));
            }
        }, [items, downPress]);

        useEffect(() => {
            if (items.length && upPress) {
                setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
            }
        }, [items, upPress]);

        const children = items.map((item, index) => renderItem({ item, index, cursor, onClick: onItemClick(item) }));

        return (
            <StyledComboBox ref={ref}>
                {nullable(error, (err) => (
                    <>
                        <StyledErrorTrigger
                            ref={popupRef}
                            onMouseEnter={() => setPopupVisibility(true)}
                            onMouseLeave={() => setPopupVisibility(false)}
                        />
                        <Popup
                            tooltip
                            view="danger"
                            placement="top-start"
                            visible={popupVisible}
                            onClickOutside={onClickOutside}
                            reference={popupRef}
                        >
                            {err.message}
                        </Popup>
                    </>
                ))}

                <span ref={popupRef} {...onESC}>
                    {renderTrigger ? (
                        <>
                            {editMode
                                ? renderInput({ value, disabled, ref: inputRef, ...onENTER })
                                : renderTrigger({ text, value, disabled, ref: buttonRef, onClick: onTriggerClick })}
                        </>
                    ) : (
                        renderInput({ value, disabled, ref: inputRef, ...onENTER })
                    )}
                </span>

                <Popup
                    placement="bottom-start"
                    visible={popupVisible && Boolean(items.length)}
                    onClickOutside={onClickOutside}
                    reference={popupRef}
                    interactive
                    arrow={false}
                    minWidth={minWidth}
                    maxWidth={maxWidth}
                    offset={[-4, 8]}
                >
                    <div {...onESC}>{renderItems ? renderItems(children) : children}</div>
                </Popup>
            </StyledComboBox>
        );
    },
);

export default ComboBox;
