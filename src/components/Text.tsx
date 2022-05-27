import React from 'react';
import styled, { css } from 'styled-components';

import { fontDisplay } from '../design/@generated/themes';

const textSizes = {
    xxs: '0.5rem',
    xs: '0.75rem',
    s: '0.875rem',
    xxl: '4rem',
};

const lineHeight = {
    xxs: '1.5',
    xs: '1.5',
    s: '1.5',
    xxl: '1',
};

const textWeight = {
    bolder: 800,
    bold: 600,
    regular: 400,
    thin: 300,
    thinner: 200,
};

interface TextProps {
    h1?: boolean;
    h2?: boolean;
    h3?: boolean;
    h4?: boolean;

    size?: keyof typeof textSizes;

    as?: string;
}

const calcTextSize = (size: keyof typeof textSizes, weight: keyof typeof textWeight = 'regular') =>
    css`
        font-size: ${textSizes[size]};
        line-height: ${lineHeight[size]};
        font-weight: ${textWeight[weight]};
    `;

const StyledText = styled.div<TextProps>`
    font-size: 16px;
    font-family: ${fontDisplay};

    ${({ size }) => size && calcTextSize(size)}

    ${({ h1 }) =>
        h1 &&
        css`
            letter-spacing: -0.015em;
            // padding-bottom: var(--sm);
            // padding-top: var(--sxl);
            ${calcTextSize('xxl', 'bolder')}
        `}
`;

const hLvl = ['h1', 'h2', 'h3', 'h4'];
const defaultTag = 'div';

export const Text: React.FC<TextProps> = ({ as = defaultTag, ...props }) => {
    let asTag = as;

    for (const hTag of hLvl) {
        if ((props as Record<string, unknown>)[hTag]) {
            asTag = hTag;
            break;
        }
    }

    return <StyledText {...props} as={asTag as any} />;
};
