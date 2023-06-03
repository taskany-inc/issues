import styled from 'styled-components';
import { gapS, gapSm, gray4, radiusM, textColor } from '@taskany/colors';
import React from 'react';

export const Table = styled.div<{ columns: number }>`
    display: grid;
    grid-template-columns: ${({ columns }) => {
        if (columns < 2) {
            return '1fr';
        }

        if (columns === 2) {
            return 'minmax(410px, 30%) repeat(10, max-content) 1fr';
        }

        return `minmax(410px, 30%) repeat(${columns - 2}, max-content) 1fr`;
    }};

    width: 100%;
    margin: 0 -20px;
    padding: 0 20px;
`;

export const TableCell = styled.div<{ align?: 'center' | 'left' | 'right' }>`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    font-size: 0;

    transition: background-color 150ms ease-in;
    text-align: ${({ align = 'left' }) => align};
    box-sizing: border-box;

    padding: ${({ children }) => (React.Children.count(children) ? gapS : 0)};

    &:last-child {
        white-space: nowrap;
        padding: ${gapS} ${gapSm} ${gapS} ${gapS};
        border-radius: 0 ${radiusM} ${radiusM} 0;
    }

    &:first-child {
        padding: ${gapS} ${gapS} ${gapS} ${gapSm};
        border-radius: ${radiusM} 0 0 ${radiusM};
    }
`;

export const TableRow = styled.a<{ focused?: boolean }>`
    display: contents;

    color: ${textColor};
    text-decoration: none;

    &:hover ${TableCell} {
        background-color: ${gray4};
    }

    &:visited ${TableCell} {
        color: ${textColor};
    }

    ${({ focused }) =>
        focused &&
        `
        ${TableCell} {
            background-color: ${gray4};
        }
    `}

    box-sizing: border-box;
`;

export const TableFullWidthCell = styled.div`
    grid-column: 1/-1;
`;
