import React from 'react';
import styled from 'styled-components';

import { gray4, gray8, textColor } from '../design/@generated/themes';

interface KeyboardProps {
    command?: boolean;
    shift?: boolean;
    option?: boolean;
    ctrl?: boolean;
    enter?: boolean;
}

const StyledKeyboard = styled.kbd`
    line-height: 1.1em;
    text-align: center;
    display: inline-block;
    color: ${textColor};
    background-color: ${gray4};
    font-family: sans-serif;
    border-radius: 4px;
    border: 1px solid ${gray8};
    padding: 4px 6px;

    span {
        font-size: inherit;
        text-align: center;
        display: inline-block;
        vertical-align: middle;
    }

    span + span {
        margin-left: 0.3em;
    }
`;

export const Keyboard: React.FC<KeyboardProps> = ({ command, shift, option, ctrl, enter, children }) => {
    return (
        <StyledKeyboard>
            {command && <span>⌘</span>}
            {shift && <span>⇧</span>}
            {option && <span>⌥</span>}
            {ctrl && <span>⌃</span>}
            {enter && <span>⏎</span>}
            {children && <span>{children}</span>}
        </StyledKeyboard>
    );
};
