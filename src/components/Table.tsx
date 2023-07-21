import styled from 'styled-components';
import { gapS, gapSm, gray4, gray9, radiusM, textColor, gray6 } from '@taskany/colors';
import React from 'react';
import { Text } from '@taskany/bricks';

export const Table = styled.div<{ columns: number; minmax?: number; offset?: number }>`
    display: grid;
    grid-template-columns: ${({ columns, minmax = 410, offset = 0 }) => {
        if (columns < 2) {
            return '1fr';
        }

        if (columns === 2) {
            return `${minmax - offset}px repeat(10, max-content) 1fr`;
        }

        return `${minmax - offset}px repeat(${columns - 2}, max-content) 1fr`;
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
    justify-content: ${({ align = 'left' }) => {
        switch (align) {
            case 'center':
                return 'center';
            case 'right':
                return 'flex-end';
            case 'left':
            default:
                return 'flex-start';
        }
    }};
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

export const TableRow = styled.div<{ focused?: boolean; disabled?: boolean }>`
    display: contents;

    color: ${textColor};
    text-decoration: none;

    ${({ disabled }) =>
        !disabled &&
        `
        &:hover ${TableCell} {
            background-color: ${gray6}};
            cursor: pointer;
        }
    `}

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

export const TitleItem = styled(TableCell)`
    overflow: hidden;
    white-space: normal;
`;

export const ContentItem = styled(TableCell)`
    justify-self: center;
    align-self: center;
    padding: ${gapS} ${gapS};
`;

export const CellContent = styled.div`
    display: flex;
    align-items: center;
    align-self: baseline;
`;

export const TitleContainer = styled.div`
    display: flex;
`;

export const Title = styled(Text)`
    margin-right: ${gapS};
    text-overflow: ellipsis;
    overflow: hidden;
`;

export const TextItem = styled(Text).attrs({
    size: 's',
    weight: 'bold',
    color: gray9,
})``;

export const Cell: React.FC<
    { children?: React.ReactNode; className?: string } & React.ComponentProps<typeof ContentItem>
> = ({ children, ...rest }) => (
    <ContentItem {...rest}>
        <CellContent>{children}</CellContent>
    </ContentItem>
);
