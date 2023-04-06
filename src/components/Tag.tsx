import React, { MouseEventHandler, useCallback } from 'react';
import styled from 'styled-components';
import { colorPrimary, gapXs, gray10, gray5, gray6, gray9, radiusL, textColorPrimary } from '@taskany/colors';

import { nullable } from '../utils/nullable';

import { CleanButton } from './CleanButton';

interface TagProps {
    title: string;
    description?: string;
    size?: 's' | 'm';
    className?: string;
    checked?: boolean;

    onClick?: MouseEventHandler<HTMLDivElement>;
    onHide?: () => void;
}

const StyledCleanButton = styled(CleanButton)``;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledTag = styled(({ onHide, ...props }: Partial<TagProps> & { children?: React.ReactNode }) => (
    <div {...props} />
))`
    display: inline-block;
    position: relative;
    padding: 4px 12px 5px;

    border-radius: ${radiusL};

    font-size: 12px;
    line-height: 12px;
    font-weight: 500;
    color: ${gray9};
    user-select: none;

    cursor: default;

    background-color: ${gray5};

    transition: background-color, color 300ms ease-in-out;

    & + & {
        margin-left: ${gapXs};
    }

    ${({ onHide, checked }) =>
        !onHide &&
        !checked &&
        `
            &:hover {
                color: ${gray10};

                background-color: ${gray6};
            }
        `}

    &:hover {
        ${StyledCleanButton} {
            visibility: visible;

            cursor: pointer;
        }
    }

    ${({ onClick }) =>
        onClick &&
        `
            cursor: pointer;
        `}

    ${({ size }) =>
        size === 's' &&
        `
            padding: 3px 10px;
            font-size: 11px;
        `}

    ${({ checked }) =>
        checked &&
        `
            color: ${textColorPrimary};

            background-color: ${colorPrimary};
        `}
`;

export const Tag: React.FC<TagProps> = ({ title, description, size = 'm', onClick, onHide, className, checked }) => {
    const onHideClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            onHide?.();
        },
        [onHide],
    );

    return (
        <StyledTag
            size={size}
            onClick={onClick}
            onHide={onHide}
            title={description}
            className={className}
            checked={checked}
        >
            {nullable(onHide, () => (
                <StyledCleanButton onClick={onHideClick} />
            ))}
            {title}
        </StyledTag>
    );
};
