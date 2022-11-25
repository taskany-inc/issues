import React from 'react';
import styled, { css } from 'styled-components';

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
} from '../design/@generated/themes';
import { is } from '../utils/styles';

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
    type?: 'submit';
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    brick?: 'left' | 'right' | 'center';
    className?: string;

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ forwardRef, size, view, brick, iconRight, iconLeft, ghost, checked, outline, ...props }) => (
        <button ref={forwardRef} {...props} />
    ),
)`
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
        css`
            cursor: pointer;
            user-select: none;

            :active:not([disabled]) {
                transform: scale(0.985);
            }
        `}

    ${({ view }) =>
        view === 'default' &&
        css`
            color: ${gray10};
            border-color: ${gray7};
            background-color: ${gray4};

            --color: ${gray9};
        `}

    ${({ view, onClick }) =>
        view === 'default' &&
        onClick &&
        css`
            :hover:not([disabled]),
            :focus:not([disabled]) {
                color: ${textColor};
                border-color: ${gray8};
                background-color: ${gray6};
            }
        `}

    ${is(
        { view: 'primary' },
        css`
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
        `,
    )}

    ${is(
        { view: 'warning' },
        css`
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
        `,
    )}

    ${is(
        { view: 'danger' },
        css`
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
        `,
    )}

    ${is(
        { outline: true },
        css`
            background-color: transparent;

            color: var(--color);

            :hover:not([disabled]),
            :focus:not([disabled]),
            :active:not([disabled]) {
                color: ${textColor};
            }
        `,
    )}

    ${is(
        { size: 's' },
        css`
            padding: 3px 12px;

            font-size: 12px;
        `,
    )}

    ${is(
        { size: 'm' },
        css`
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
    )}

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
