import styled from 'styled-components';
import { gapS, gray2, gray3, radiusS, textColor } from '@taskany/colors';

interface FormActionsProps {
    flat?: 'top' | 'bottom';
    focused?: boolean;
    children?: React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const FormActions = styled(({ flat, focused, ...props }: FormActionsProps) => <div {...props} />)`
    box-sizing: border-box;
    padding: ${gapS};
    display: grid;
    grid-template-columns: 8fr 4fr;
    align-items: center;

    border-radius: ${radiusS};

    background-color: ${gray3};

    color: ${textColor};

    ${({ focused }) =>
        focused &&
        `
            background-color: ${gray2};
        `}

    ${({ flat }) =>
        flat === 'top' &&
        `
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        `}

    ${({ flat }) =>
        flat === 'bottom' &&
        `
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        `}
`;

export const FormAction = styled.div<{ left?: boolean; right?: boolean; columns?: number; inline?: boolean }>`
    box-sizing: border-box;
    display: flex;
    align-items: center;

    ${({ left }) =>
        left &&
        `
            justify-self: start;
            text-align: left;
        `}

    ${({ right }) =>
        right &&
        `
            justify-self: end;
            text-align: right;
        `}

    ${({ columns }) =>
        columns &&
        `
            display: grid;
            align-items: center;
            grid-template-columns: repeat(${columns}, 1fr);
        `}

    ${({ inline }) =>
        inline &&
        `
            & > * {
                display: inline-block;
            }

            & > * + * {
                margin-left: 6px;
            }
        `}
`;
