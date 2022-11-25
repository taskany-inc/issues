/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { danger10 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

const Popup = dynamic(() => import('./Popup'));

interface DropdownTriggerProps {
    ref: React.RefObject<HTMLButtonElement>;
    value?: DropdownProps['value'];
    visible?: boolean;
    disabled?: boolean;
    text?: string;

    onClick: () => void;
}

interface DropdownItemProps {
    item: any;
    index: number;
    cursor: number;

    onClick: (value?: any) => void;
}

interface DropdownProps {
    renderItem: (props: DropdownItemProps) => React.ReactNode;
    renderTrigger: (props: DropdownTriggerProps) => React.ReactNode;
    text?: string;
    value?: any;
    items?: any[];
    visible?: boolean;
    disabled?: boolean;
    error?: {
        message?: string;
    };

    onChange?: (value: any) => void;
}

const StyledDropdown = styled.span`
    position: relative;
    display: inline-block;
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

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
    ({ visible = false, items = [], text, value, disabled, error, renderItem, renderTrigger, onChange }, ref) => {
        const popupRef = useRef<HTMLDivElement>(null);
        const buttonRef = useRef<HTMLButtonElement>(null);
        const [popupVisible, setPopupVisibility] = useState(visible);
        const downPress = useKeyPress('ArrowDown');
        const upPress = useKeyPress('ArrowUp');
        const [cursor, setCursor] = useState(0);

        useEffect(() => {
            setPopupVisibility(visible);
        }, [visible]);

        const onClickOutside = useCallback(() => {
            setPopupVisibility(false);
        }, []);

        const onTriggerClick = useCallback(() => {
            setPopupVisibility(true);
        }, []);

        const onItemClick = useCallback(
            (value: any) => () => {
                setPopupVisibility(false);
                onChange && onChange(value);
            },
            [onChange],
        );

        const [onESC] = useKeyboard([KeyCode.Escape], () => {
            setPopupVisibility(false);
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
            <StyledDropdown ref={ref}>
                {!disabled &&
                    nullable(error, (err) => (
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
                    <span {...onENTER}>
                        {renderTrigger({
                            ref: buttonRef,
                            value,
                            text,
                            disabled,
                            visible: popupVisible,
                            onClick: onTriggerClick,
                        })}
                    </span>
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
            </StyledDropdown>
        );
    },
);

export default Dropdown;
