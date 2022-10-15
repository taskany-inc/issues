import styled, { css } from 'styled-components';

import { gapM, gapS, gray4, gray7, radiusXl, textColor } from '../design/@generated/themes';

export const TabsMenu = styled.div`
    padding: ${gapM} 0 0;

    margin-left: -6px; // radius compensation
`;

export const TabsMenuItem = styled.div<{ active?: boolean }>`
    display: inline-block;
    padding: ${gapS} ${gapM};

    border-radius: ${radiusXl};

    color: ${gray7};

    ${({ active }) =>
        active &&
        css`
            font-weight: 600;
            color: ${textColor};

            background-color: ${gray4};
        `}
`;
