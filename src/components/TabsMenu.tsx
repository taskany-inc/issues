import styled from 'styled-components';
import { gapM, gapS, gray4, gray7, radiusXl, textColor } from '@taskany/colors';

export const TabsMenu = styled.div`
    padding: ${gapM} 0 0;

    margin-left: -6px; // radius compensation
`;

export const TabsMenuItem = styled.div<{ active?: boolean }>`
    display: inline-block;
    padding: ${gapS} ${gapM};

    border-radius: ${radiusXl};

    color: ${gray7};

    cursor: pointer;

    &:first-child {
        padding-left: 6px;
    }

    ${({ active }) =>
        active &&
        `
            padding: ${gapS} ${gapM};

            font-weight: 600;
            color: ${textColor};

            cursor: default;

            background-color: ${gray4};

            &:first-child {
                padding: ${gapS} ${gapM};
            }
        `}
`;
