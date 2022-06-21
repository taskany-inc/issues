import styled, { css } from 'styled-components';

import { gray3, radiusS, textColor } from '../design/@generated/themes';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const FormActions = styled(({ flat, ...props }) => <div {...props} />)<{ flat?: 'top' | 'bottom' }>`
    box-sizing: border-box;
    padding: 8px 10px 12px 10px;
    display: grid;
    grid-template-columns: 8fr 4fr;
    align-items: end;

    border-radius: ${radiusS};

    background-color: ${gray3};

    color: ${textColor};

    ${({ flat }) =>
        flat === 'top' &&
        css`
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        `}

    ${({ flat }) =>
        flat === 'bottom' &&
        css`
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        `}
`;

export const FormAction = styled.div<{ left?: boolean; right?: boolean; columns?: number; inline?: boolean }>`
    box-sizing: border-box;

    ${({ left }) =>
        left &&
        css`
            justify-self: start;
            text-align: left;
        `}

    ${({ right }) =>
        right &&
        css`
            justify-self: end;
            text-align: right;
        `}

    ${({ columns }) =>
        columns &&
        css`
            display: grid;
            align-items: center;
            grid-template-columns: repeat(${columns}, 1fr);
        `}

    ${({ inline }) =>
        inline &&
        css`
            & > * {
                display: inline-block;
            }

            & > * + * {
                margin-left: 6px;
            }
        `}
`;
