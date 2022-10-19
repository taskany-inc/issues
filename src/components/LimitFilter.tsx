import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { gapS, gapXs, gray4, radiusM } from '../design/@generated/themes';

import { Button } from './Button';
import { Popup } from './Popup';
import { FiltersMenuItem } from './FiltersMenuItem';

export const defaultLimit = 10;
const limitVariants = [defaultLimit, 20, 30, 50, 100];

interface StateFilterProps {
    text: string;
    disabled?: React.ComponentProps<typeof Button>['disabled'];

    onClick?: (l: number) => void;
}

const StyledDropdownItem = styled.div<{ focused?: boolean }>`
    box-sizing: border-box;
    padding: ${gapXs} ${gapS};

    border-radius: ${radiusM};

    cursor: pointer;

    transition: background-color 150ms ease-in;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        background-color: ${gray4};
    }

    ${({ focused }) =>
        focused &&
        css`
            background-color: ${gray4};
        `}
`;

export const LimitFilter: React.FC<StateFilterProps> = ({ text, disabled, onClick }) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState<number>();
    const [selected, setSelected] = useState(defaultLimit);

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(!popupVisible);
    }, [popupVisible]);

    const onItemClick = useCallback(
        (l: number) => () => {
            setSelected(l);

            onClick && onClick(l);
            setPopupVisibility(false);
        },
        [onClick],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => popupVisible && setPopupVisibility(false));

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        if (limitVariants.length && cursor) {
            onItemClick(limitVariants[cursor])();
        }
    });

    useEffect(() => {
        if (limitVariants.length && downPress) {
            setCursor((prevState = 0) => (prevState < limitVariants.length - 1 ? prevState + 1 : prevState));
        }
    }, [downPress]);

    useEffect(() => {
        if (limitVariants.length && upPress) {
            setCursor((prevState = 0) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [upPress]);

    return (
        <>
            <span ref={popupRef} {...onESC} {...onENTER}>
                <FiltersMenuItem
                    ref={buttonRef}
                    onClick={onButtonClick}
                    disabled={disabled}
                    active={selected !== defaultLimit}
                >
                    {text}
                </FiltersMenuItem>
            </span>

            <Popup
                placement="top-start"
                visible={popupVisible}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={50}
                maxWidth={50}
                offset={[0, 4]}
            >
                <>
                    {limitVariants.map((l, i) => (
                        <StyledDropdownItem key={l} focused={l === selected || cursor === i} onClick={onItemClick(l)}>
                            {l}
                        </StyledDropdownItem>
                    ))}
                </>
            </Popup>
        </>
    );
};
