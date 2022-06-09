import React, { useCallback } from 'react';
import styled, { css } from 'styled-components';

import { gray10, gray5, gray6, gray7, gray8, gray9 } from '../design/@generated/themes';

interface TagProps {
    title: string;
    description?: string;
    size?: 's' | 'm';
    className?: string;
    onClick?: () => void;
    onHide?: () => void;
}

const StyledCleanButton = styled.div`
    visibility: hidden;
    position: absolute;
    transform: rotate(45deg);
    top: -4px;
    right: -4px;
    width: 14px;
    height: 14px;

    text-align: center;
    line-height: 12px;
    font-size: 12px;
    color: ${gray10};

    border-radius: 100%;

    cursor: pointer;

    background-color: ${gray7};

    transition: background-color 300ms ease-in-out;

    &:hover {
        background-color: ${gray8};
    }
`;

const StyledTag = styled.div<{ size: TagProps['size']; onClick: TagProps['onClick'] }>`
    display: inline-block;
    position: relative;
    padding: 4px 12px 5px;

    border-radius: 12px;

    font-size: 12px;
    line-height: 12px;
    font-weight: 500;
    color: ${gray9};
    user-select: none;

    cursor: default;

    background-color: ${gray5};

    transition: background-color, color 300ms ease-in-out;

    &:hover {
        color: ${gray10};

        background-color: ${gray6};

        ${StyledCleanButton} {
            visibility: visible;
        }
    }

    ${({ onClick }) =>
        onClick &&
        css`
            cursor: pointer;
        `}

    ${({ size }) =>
        size === 's' &&
        css`
            padding: 3px 10px;
            font-size: 11px;
        `}
`;

export const Tag: React.FC<TagProps> = ({ title, description, size = 'm', onClick, onHide, className }) => {
    const onHideClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            onHide && onHide();
        },
        [onHide],
    );

    return (
        <StyledTag size={size} onClick={onClick} title={description} className={className}>
            {onHide && <StyledCleanButton onClick={onHideClick}>+</StyledCleanButton>}
            {title}
        </StyledTag>
    );
};
