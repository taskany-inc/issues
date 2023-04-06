import styled, { css, createGlobalStyle } from 'styled-components';
import { fontDisplay, gapL, gapM, gapS, gapSm, gapXl, gapXs, textColor } from '@taskany/colors';

const textSizes = {
    xxs: '0.5rem',
    xs: '0.75rem',
    s: '0.875rem',
    m: '1rem',
    l: '1.25rem',
    xl: '1.75rem',
    xxl: '3rem',
};

const lineHeight = {
    xxs: '1.5',
    xs: '1.5',
    s: '1.5',
    m: '1.5',
    l: '1.15',
    xl: '1.15',
    xxl: '1',
};

const textWeight = {
    bolder: 800,
    bold: 600,
    regular: 400,
    thin: 300,
    thinner: 200,
};

const calcTextSize = (size: keyof typeof textSizes, weight: keyof typeof textWeight = 'regular') =>
    css`
        font-size: ${textSizes[size]};
        line-height: ${lineHeight[size]};
        font-weight: ${textWeight[weight]};
    `;

interface TextProps {
    size?: keyof typeof textSizes;
    weight?: keyof typeof textWeight;
    color?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Text = styled.div<TextProps>`
    font-size: 16px;
    font-family: ${fontDisplay};
    color: ${textColor};

    ${({ size }) => size && calcTextSize(size)}

    ${({ size }) =>
        size === 'xxl' &&
        css`
            letter-spacing: -0.015em;
        `}

    ${({ weight }) =>
        weight &&
        css`
            font-weight: ${textWeight[weight]};
        `}

    ${({ color }) =>
        color &&
        css`
            color: ${color};
        `}
`;

export const TextStyle = createGlobalStyle`
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    p,
    li {
        margin-top: 0;
        margin-bottom: 0;

        &:first-child {
            padding-top: 0;
        }
        &:last-child {
            padding-bottom: 0;
        }
    }

    h1 {
        letter-spacing: -0.015em;
        ${calcTextSize('xxl', 'bolder')}
        padding-bottom: ${gapM};
        padding-top: ${gapXl};
    }

    h2 {
        ${calcTextSize('xl', 'bolder')}
        padding-top: ${gapS};
        padding-bottom: ${gapM};
    }

    h3 {
        ${calcTextSize('l', 'regular')}
        padding-top: ${gapM};
        padding-bottom: ${gapS};
    }

    h4 {
        ${calcTextSize('m', 'bold')}
        padding-top: ${gapS};
        padding-bottom: ${gapS};
    }

    h5 {
        ${calcTextSize('m', 'regular')}
        padding-top: ${gapS};
        padding-bottom: ${gapS};
    }

    p,
    ul,
    ol {
        ${calcTextSize('m', 'regular')}
        padding-top: ${gapXs};
        padding-bottom: ${gapSm};
        &:first-child {
            padding-top: 0;
        }
        &:last-child {
            padding-bottom: 0;
        }
    }

    li {
        ${calcTextSize('m', 'regular')}
        padding-bottom: ${gapXs};
        &:first-child {
            padding-top: 0;
        }
        &:last-child {
            padding-bottom: 0;
        }
    }

    blockquote {
        padding: ${gapSm} ${gapSm} ${gapSm} ${gapL};
    }

    strong {
        background: transparent;
        font-weight: ${textWeight.bolder};
    }
`;
