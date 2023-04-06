import styled from 'styled-components';
import { gapS, gray9, radiusXl, textColor } from '@taskany/colors';

interface FiltersMenuItemProps {
    active?: boolean;
    disabled?: boolean;
}

export const FiltersMenuItem = styled.span<FiltersMenuItemProps>`
    display: inline-block;
    padding: ${gapS};

    cursor: pointer;

    user-select: none;

    border-radius: ${radiusXl};

    font-weight: 600;

    color: ${gray9};

    transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
    transition-property: color;

    ${({ active }) =>
        active &&
        `
            color: ${textColor};
        `}

    &:hover {
        color: ${textColor};
    }
`;
