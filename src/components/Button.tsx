import React from 'react';
import styled, { css } from 'styled-components';

import {
    buttonTextColor,
    buttonTextColorHover,
    buttonBackgroundColor,
    buttonBorderColor,
    buttonBackgroundColorHover,
    buttonBorderColorHover,
    buttonOutlineTextColor,
    buttonOutlineTextColorHover,
    buttonOutlineBackgroundColor,
    buttonOutlineBorderColor,
    buttonOutlineBackgroundColorHover,
    buttonOutlineBorderColorHover,
    buttonPrimaryTextColor,
    buttonPrimaryBackgroundColor,
    buttonPrimaryBorderColor,
    buttonPrimaryBackgroundColorHover,
    buttonPrimaryBorderColorHover,
    buttonPrimaryOutlineTextColor,
    buttonPrimaryOutlineTextColorHover,
    buttonPrimaryOutlineBackgroundColor,
    buttonPrimaryOutlineBorderColor,
    buttonPrimaryOutlineBackgroundColorHover,
    buttonPrimaryOutlineBorderColorHover,
    buttonWarningTextColor,
    buttonWarningBackgroundColor,
    buttonWarningBorderColor,
    buttonWarningBackgroundColorHover,
    buttonWarningBorderColorHover,
    buttonWarningOutlineTextColor,
    buttonWarningOutlineTextColorHover,
    buttonWarningOutlineBackgroundColor,
    buttonWarningOutlineBorderColor,
    buttonWarningOutlineBackgroundColorHover,
    buttonWarningOutlineBorderColorHover,
    buttonDangerTextColor,
    buttonDangerBackgroundColor,
    buttonDangerBorderColor,
    buttonDangerBackgroundColorHover,
    buttonDangerBorderColorHover,
    buttonDangerOutlineTextColor,
    buttonDangerOutlineTextColorHover,
    buttonDangerOutlineBackgroundColor,
    buttonDangerOutlineBorderColor,
    buttonDangerOutlineBackgroundColorHover,
    buttonDangerOutlineBorderColorHover,
} from '../design/@generated/themes';
import { is } from '../utils/styles';

interface ButtonProps {
    text: string;
    tabIndex?: number;
    disabled?: boolean;
    ghost?: boolean;
    checked?: boolean;
    view?:
        | 'default'
        | 'primary'
        | 'warning'
        | 'danger'
        | 'outline'
        | 'primary-outline'
        | 'warning-outline'
        | 'danger-outline';
    size?: 's' | 'm' | 'l';
    type?: 'submit';
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    brick?: 'left' | 'right' | 'center';
    onClick?: React.MouseEventHandler;
}

const StyledButton = styled(({ forwardRef, size, view, brick, iconRight, iconLeft, ghost, checked, ...props }) => (
    <button ref={forwardRef} {...props} />
))`
    position: relative;
    display: inline-block;
    font-weight: 500;
    line-height: 20px;
    white-space: nowrap;
    vertical-align: middle;
    cursor: pointer;
    user-select: none;
    outline: none;
    border: 1px solid;
    border-radius: 6px;
    appearance: none;
    transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
    transition-property: color, background-color, border-color;

    :hover,
    :focus {
        transition-duration: 0.1s;
    }

    :disabled {
        cursor: not-allowed;
        opacity: 0.6;
        transition: none;
    }

    ${is(
        { size: 's' },
        css`
            padding: 3px 12px;

            font-size: 12px;
        `,
    )}

    ${({ size }) =>
        size === 'm' &&
        css`
            padding: 5px 16px;

            font-size: 14px;

            span + span {
                padding-left: 5px;
            }
        `}

    ${({ iconRight, iconLeft, size }) =>
        size === 'm' &&
        (iconRight || iconLeft) &&
        css`
            padding: 5px 10px;
        `}

    ${is(
        { size: 'l' },
        css`
            padding: 0.6em 1.5em;

            font-size: 16px;
        `,
    )}

    ${is(
        { view: 'default' },
        css`
            color: ${buttonTextColor};
            border-color: ${buttonBorderColor};
            background-color: ${buttonBackgroundColor};

            :hover:not([disabled]),
            :focus:not([disabled]) {
                color: ${buttonTextColorHover};
                border-color: ${buttonBorderColorHover};
                background-color: ${buttonBackgroundColorHover};
            }

            :active:not([disabled]) {
                color: ${buttonTextColorHover};
                background-color: ${buttonBackgroundColor};
            }
        `,
    )}

    ${is(
        { view: 'primary' },
        css`
            color: ${buttonPrimaryTextColor};
            border-color: ${buttonPrimaryBorderColor};
            background-color: ${buttonPrimaryBackgroundColor};

            :hover:not([disabled]),
            :focus:not([disabled]) {
                border-color: ${buttonPrimaryBorderColorHover};
                background-color: ${buttonPrimaryBackgroundColorHover};
            }

            :active:not([disabled]) {
                background-color: ${buttonPrimaryBackgroundColor};
            }
        `,
    )}

    ${is(
        { view: 'warning' },
        css`
            color: ${buttonWarningTextColor};
            border-color: ${buttonWarningBorderColor};
            background-color: ${buttonWarningBackgroundColor};

            :hover:not([disabled]),
            :focus:not([disabled]) {
                border-color: ${buttonWarningBorderColorHover};
                background-color: ${buttonWarningBackgroundColorHover};
            }

            :active:not([disabled]) {
                background-color: ${buttonWarningBackgroundColor};
            }
        `,
    )}

    ${is(
        { view: 'danger' },
        css`
            color: ${buttonDangerTextColor};
            border-color: ${buttonDangerBorderColor};
            background-color: ${buttonDangerBackgroundColor};

            :hover:not([disabled]),
            :focus:not([disabled]) {
                border-color: ${buttonDangerBorderColorHover};
                background-color: ${buttonDangerBackgroundColorHover};
            }

            :active:not([disabled]) {
                background-color: ${buttonDangerBackgroundColor};
            }
        `,
    )}

    ${is(
        { view: 'outline' },
        css`
            color: ${buttonOutlineTextColor};
            border-color: ${buttonOutlineBorderColor};
            background-color: transparent;

            :hover:not([disabled]),
            :focus:not([disabled]) {
                color: ${buttonOutlineTextColorHover};
                border-color: ${buttonOutlineBorderColorHover};
                background-color: ${buttonOutlineBackgroundColorHover};
            }

            :active:not([disabled]) {
                color: ${buttonOutlineTextColorHover};
                background-color: ${buttonOutlineBackgroundColor};
            }
        `,
    )}

    ${is(
        { view: 'outline', checked: true },
        css`
            color: ${buttonOutlineTextColorHover};
            border-color: ${buttonOutlineBorderColorHover};
            background-color: ${buttonOutlineBackgroundColorHover};
        `,
    )}

    ${is(
        { view: 'primary-outline' },
        css`
            color: ${buttonPrimaryOutlineTextColor};
            border-color: ${buttonPrimaryOutlineBorderColor};
            background-color: ${buttonPrimaryOutlineBackgroundColor};

            :hover:not([disabled]),
            :focus:not([disabled]) {
                color: ${buttonPrimaryOutlineTextColorHover};
                border-color: ${buttonPrimaryOutlineBorderColorHover};
                background-color: ${buttonPrimaryOutlineBackgroundColorHover};
            }

            :active:not([disabled]) {
                color: ${buttonPrimaryOutlineTextColorHover};
                background-color: ${buttonPrimaryOutlineBackgroundColor};
            }
        `,
    )}

    ${is(
        { view: 'warning-outline' },
        css`
            color: ${buttonWarningOutlineTextColor};
            border-color: ${buttonWarningOutlineBorderColor};
            background-color: ${buttonWarningOutlineBackgroundColor};

            :hover:not([disabled]),
            :focus:not([disabled]) {
                color: ${buttonWarningOutlineTextColorHover};
                border-color: ${buttonWarningOutlineBorderColorHover};
                background-color: ${buttonWarningOutlineBackgroundColorHover};
            }

            :active:not([disabled]) {
                color: ${buttonWarningOutlineTextColorHover};
                background-color: ${buttonWarningOutlineBackgroundColor};
            }
        `,
    )}

    ${is(
        { view: 'danger-outline' },
        css`
            color: ${buttonDangerOutlineTextColor};
            border-color: ${buttonDangerOutlineBorderColor};
            background-color: ${buttonDangerOutlineBackgroundColor};

            :hover:not([disabled]),
            :focus:not([disabled]) {
                color: ${buttonDangerOutlineTextColorHover};
                border-color: ${buttonDangerOutlineBorderColorHover};
                background-color: ${buttonDangerOutlineBackgroundColorHover};
            }

            :active:not([disabled]) {
                color: ${buttonDangerOutlineTextColorHover};
                background-color: ${buttonDangerOutlineBackgroundColor};
            }
        `,
    )}

    ${is(
        { brick: 'left' },
        css`
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        `,
    )}

    ${is(
        { brick: 'right' },
        css`
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        `,
    )}

    ${is(
        { brick: 'center' },
        css`
            border-radius: 0;
        `,
    )}

    ${is(
        { ghost: true },
        css`
            border-color: transparent;
        `,
    )}
`;

const StyledText = styled.span`
    display: inline-block;
`;

const StyledIcon = styled.span`
    line-height: initial;
    vertical-align: inherit;
`;

export const Button = React.forwardRef<ButtonProps, ButtonProps>(
    ({ text, view = 'default', size = 'm', type = 'button', ...props }, ref) => {
        const content =
            props.iconLeft || props.iconRight ? (
                <>
                    {props.iconLeft ? <StyledIcon>{props.iconLeft}</StyledIcon> : null}
                    <StyledText>{text}</StyledText>
                    {props.iconRight ? <StyledIcon>{props.iconRight}</StyledIcon> : null}
                </>
            ) : (
                text
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
                {content}
            </StyledButton>
        );
    },
);
