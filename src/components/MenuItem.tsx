import React from 'react';
import styled, { css } from 'styled-components';

import { gray4, gray7, gray8, radiusM } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

import { Dot } from './Dot';

interface MenuItemProps {
    selected?: boolean;
    focused?: boolean;
    children?: React.ReactNode;
    view?: React.ComponentProps<typeof Dot>['view'];

    onClick?: () => void;
}

const StyledMenuItem = styled.div<{ focused?: boolean }>`
    box-sizing: border-box;
    justify-content: center;
    align-items: center;

    padding: 6px;
    margin-bottom: 4px;

    border: 1px solid ${gray7};
    border-radius: ${radiusM};

    font-size: 13px;

    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        border-color: ${gray8};
        background-color: ${gray4};
    }

    ${({ focused }) =>
        focused &&
        css`
            border-color: ${gray8};
            background-color: ${gray4};
        `}
`;

export const MenuItem: React.FC<MenuItemProps> = ({ children, selected, focused, view, onClick }) => (
    <StyledMenuItem focused={focused} onClick={onClick}>
        {children}
        {nullable(selected, () => (
            <Dot view={view} />
        ))}
    </StyledMenuItem>
);
