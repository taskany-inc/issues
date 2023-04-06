/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import styled from 'styled-components';
import {
    textColor,
    textColorPrimary,
    gray5,
    gray7,
    gray8,
    danger9,
    warn1,
    warn2,
    warn10,
    warn0,
    gray6,
    gray9,
    colorPrimary,
    colorPrimaryAccent,
    gray10,
    danger10,
    gray4,
    danger1,
    danger2,
    radiusM,
    backgroundColor,
} from '@taskany/colors';

interface ButtonProps {
    text?: string;
    title?: string;
    tabIndex?: number;
    disabled?: boolean;
    checked?: boolean;
    ghost?: boolean;
    view?: 'default' | 'primary' | 'warning' | 'danger';
    outline?: boolean;
    size?: 's' | 'm' | 'l';
    type?: 'submit' | 'button';
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    brick?: 'left' | 'right' | 'center';
    className?: string;
    children?: React.ReactNode;

    onClick?: React.MouseEventHandler;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
}

const StyledIcon = styled.span`
    display: flex;
    align-items: center;
`;
const StyledText = styled.span``;

const StyledButton = styled(
    ({
        forwardRef,
        size,
        view,
        brick,
        iconRight,
        iconLeft,
        ghost,
        checked,
        outline,
        ...props
    }: ButtonProps & { forwardRef?: React.Ref<HTMLButtonElement> }) => <button ref={forwardRef} {...props} />,
)<ButtonProps>`
    position: relative;
    box-sizing: border-box;

    white-space: nowrap;

    outline: none;
    appearance: none;

    border: 1px solid;
    border-radius: ${radiusM};

    transition: 200ms cubic-bezier(0.3, 0, 0.5, 1);
    transition-property: color, background-color, border-color;

    :disabled {
        cursor: not-allowed;
        transition: none;

        color: ${gray8};
        border-color: ${gray6};
        background-color: ${gray5};
    }

    ${({ onClick }) =>
        onClick &&
        `
            cursor: pointer;
            user-select: none;

            :active:not([disabled]) {
                transform: scale(0.985);
            }
        `}

    ${({ view }) =>
        view === 'default' &&
        `
            color: ${gray10};
            border-color: ${gray7};
            background-color: ${gray4};

            --color: ${gray9};
        `}

    ${({ view, onClick }) =>
        view === 'default' &&
        onClick &&
        `
            :hover:not([disabled]),
            :focus:not([disabled]) {
                color: ${textColor};
                border-color: ${gray8};
                background-color: ${gray6};
            }
        `}

    ${({ view }) =>
        view === 'primary' &&
        `
            font-weight: 500;
            color: ${textColorPrimary};
            border-color: ${colorPrimary};
            background-color: ${colorPrimary};

            --color: ${colorPrimary};

            :hover:not([disabled]),
            :focus:not([disabled]) {
                color: ${textColorPrimary};
                border-color: ${colorPrimaryAccent};
                background-color: ${colorPrimaryAccent};
            }
        `}

    ${({ view }) =>
        view === 'warning' &&
        `
            color: ${warn1};
            border-color: ${warn0};
            background-color: ${warn0};

            --color: ${warn0};

            :hover:not([disabled]),
            :focus:not([disabled]) {
                color: ${warn2};
                border-color: ${warn10};
                background-color: ${warn10};
            }
        `}

    ${({ view }) =>
        view === 'danger' &&
        `
            color: ${danger1};
            border-color: ${danger9};
            background-color: ${danger9};

            --color: ${danger9};

            :hover:not([disabled]),
            :focus:not([disabled]) {
                color: ${danger2};
                border-color: ${danger10};
                background-color: ${danger10};
            }
        `}

    ${({ outline }) =>
        outline &&
        `
            background-color: transparent;

            color: var(--color);

            :hover:not([disabled]),
            :focus:not([disabled]),
            :active:not([disabled]) {
                color: ${backgroundColor};
            }
        `}

    ${({ size }) =>
        size &&
        {
            s: `
                padding: 3px 12px;

                font-size: 12px;
            `,
            m: `
                min-height: 28px;
                padding: 5px 16px;

                font-size: 13px;

                ${StyledIcon} {
                    width: 15px;
                    height: 15px;
                }

                ${StyledIcon} + ${StyledText},
                ${StyledText} + ${StyledIcon} {
                    padding-left: 8px;
                }
            `,
            l: `
                padding: 0.6em 1.5em;

                font-size: 16px;
            `,
        }[size]}

    ${({ iconRight, iconLeft, size }) =>
        size === 'm' &&
        (iconRight || iconLeft) &&
        `
            padding: 5px 10px;
        `}

    ${({ brick }) =>
        brick &&
        {
            left: `
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
            `,
            right: `
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
            `,
            center: `
                border-radius: 0;
            `,
        }[brick]}

    ${({ ghost }) =>
        ghost &&
        `
            border-color: transparent;
            background-color: ${gray5};
        `}
`;

const Aligner = styled.span`
    display: flex;
    align-items: center;
`;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ text, view = 'default', size = 'm', type = 'button', ...props }, ref) => {
        const content =
            props.iconLeft || props.iconRight ? (
                <>
                    {props.iconLeft ? <StyledIcon>{props.iconLeft}</StyledIcon> : null}
                    {text ? <StyledText>{text}</StyledText> : null}
                    {props.iconRight ? <StyledIcon>{props.iconRight}</StyledIcon> : null}
                </>
            ) : (
                <>{text ? <StyledText>{text}</StyledText> : null}</>
            );

        return (
            <StyledButton
                type={type}
                view={view}
                size={size}
                tabIndex={props.disabled ? -1 : undefined}
                {...props}
                forwardRef={ref}
            >
                <Aligner>{content}</Aligner>
            </StyledButton>
        );
    },
);
