import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FieldError } from 'react-hook-form';

import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode, KeyboardEvents } from '../hooks/useKeyboard';

import { Popup } from './Popup';

interface ComboBoxTriggerProps {
    text: ComboBoxProps['text'];
    value: ComboBoxProps['value'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref: React.RefObject<any>;

    onClick: () => void;
}

interface ComboBoxInputProps extends Record<KeyboardEvents, React.KeyboardEventHandler<Element>> {
    value: string;
}

interface ComboBoxItemProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item: any;
    index: number;
    cursor: number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick: (value?: any) => void;
}

interface ComboBoxProps {
    text: React.ReactNode;
    renderInput: (props: ComboBoxInputProps) => React.ReactNode;
    renderItem: (props: ComboBoxItemProps) => React.ReactNode;
    renderTrigger?: (props: ComboBoxTriggerProps) => React.ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items?: any[];
    visible?: boolean;
    error?: FieldError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange?: (value: any) => void;
}

export const ComboBox: React.FC<ComboBoxProps> = ({
    text,
    value,
    visible = false,
    items = [],
    renderItem,
    renderTrigger,
    renderInput,
    onChange,
}) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (value: any) => () => {
            setEditMode(false);
            onChange && onChange(value);
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

    return (
        <>
            <span ref={popupRef} {...onESC}>
                {renderTrigger ? (
                    <>
                        {editMode
                            ? renderInput({ value: value as string, ...onENTER })
                            : renderTrigger({ text, value, ref: buttonRef, onClick: onTriggerClick })}
                    </>
                ) : (
                    renderInput({ value: value as string, ...onENTER })
                )}
            </span>

            <Popup
                placement="bottom-start"
                visible={popupVisible && Boolean(items.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                arrow={false}
                minWidth={150}
                maxWidth={250}
                offset={[-4, 8]}
            >
                <div {...onESC}>
                    {items.map((item, index) => renderItem({ item, index, cursor, onClick: onItemClick(item) }))}
                </div>
            </Popup>
        </>
    );
};
