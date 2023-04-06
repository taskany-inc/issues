import React from 'react';
import styled from 'styled-components';
import { gray10, gray7, gray8 } from '@taskany/colors';

interface CleanButtonProps {
    className?: string;

    onClick?: (e: React.MouseEvent) => void;
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

export const CleanButton: React.FC<CleanButtonProps> = ({ className, onClick }) => (
    <StyledCleanButton className={className} onClick={onClick}>
        +
    </StyledCleanButton>
);
