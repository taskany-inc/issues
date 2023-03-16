/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

import { useKeyPress } from '@common/hooks/useKeyPress';
import { useKeyboard, KeyCode, KeyboardEvents } from '@common/hooks/useKeyboard';
import { nullable } from '@common/utils/nullable';

import { danger10 } from '../design/@generated/themes';
import { flatten } from '../utils/flatten';

const Popup = dynamic(() => import('@common/Popup'));

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
    renderItem: (props: ComboBoxItemProps) => React.ReactNode | Record<any, any>;
    renderTrigger?: (props: ComboBoxTriggerProps) => React.ReactNode;
    renderItems?: (children: React.ReactNode | Array<Record<any, any>> | undefined) => React.ReactNode;
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
    className?: string;
    placement?: React.ComponentProps<typeof Popup>['placement'];
    offset?: React.ComponentProps<typeof Popup>['offset'];

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
            className,
            placement = 'bottom-start',
            offset = [-4, 8],
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
        // eslint-disable-next-line prefer-spread
        const flatItems = useMemo(() => flatten(items), [items]);

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
            onItemClick(flatItems[cursor])();
        });

        useEffect(() => {
            if (flatItems.length && downPress) {
                setCursor((prevState) => (prevState < flatItems.length - 1 ? prevState + 1 : prevState));
            }
        }, [flatItems, downPress]);

        useEffect(() => {
            if (flatItems.length && upPress) {
                setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
            }
        }, [flatItems, upPress]);

        const children = flatItems.map((item: any, index: number) =>
            renderItem({ item, index, cursor, onClick: onItemClick(item) }),
        );

        return (
            <StyledComboBox ref={ref} className={className}>
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
                    placement={placement}
                    visible={popupVisible && Boolean(flatItems.length)}
                    onClickOutside={onClickOutside}
                    reference={popupRef}
                    interactive
                    arrow={false}
                    minWidth={minWidth}
                    maxWidth={maxWidth}
                    offset={offset}
                >
                    <div {...onESC}>
                        {renderItems ? renderItems(children as React.ReactNode) : (children as React.ReactNode)}
                    </div>
                </Popup>
            </StyledComboBox>
        );
    },
);

export default ComboBox;
