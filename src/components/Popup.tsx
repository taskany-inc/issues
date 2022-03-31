import React, { ComponentProps } from 'react';
import styled, { css } from 'styled-components';
import dynamic from 'next/dynamic';

import { backgroundColor, popupDangerBackgroundColor, popupWarningBackgroundColor } from '../design/@generated/themes';

const Tippy = dynamic(() => import('@tippyjs/react/headless'));

/**
 * @see all props https://atomiks.github.io/tippyjs/v6/all-props/
 */
interface PopupProps {
    placement?: ComponentProps<typeof Tippy>['placement'];
    trigger?: ComponentProps<typeof Tippy>['trigger'];
    interactive?: ComponentProps<typeof Tippy>['interactive'];
    hideOnClick?: ComponentProps<typeof Tippy>['hideOnClick'];
    reference?: ComponentProps<typeof Tippy>['reference'];
    visible?: boolean;
    target?: React.ReactElement;
    arrow?: boolean;
    overflow?: 'hidden';
    minWidth?: number;
    maxWidth?: number;
    tooltip?: boolean;
    view?: 'warning' | 'danger' | 'success';

    onTrigger?: ComponentProps<typeof Tippy>['onTrigger'];
    onShow?: ComponentProps<typeof Tippy>['onShow'];
    onShown?: ComponentProps<typeof Tippy>['onShown'];
    onMount?: ComponentProps<typeof Tippy>['onMount'];
    onHide?: ComponentProps<typeof Tippy>['onHide'];
    onHidden?: ComponentProps<typeof Tippy>['onHidden'];
    onClickOutside?: ComponentProps<typeof Tippy>['onClickOutside'];
}

const StyledPopupArrow = styled.div`
    visibility: hidden;
    position: absolute;
    z-index: 0;

    width: 8px;
    height: 8px;

    background: inherit;

    &::before {
        visibility: visible;
        position: absolute;
        z-index: 0;

        width: 8px;
        height: 8px;

        background: inherit;

        content: '';

        transform: rotate(45deg);
    }
`;

const StyledPopupContent = styled.div`
    position: relative;
    z-index: 1;
`;

const StyledPopupContainer = styled.div<{
    overflow?: PopupProps['overflow'];
    minWidth?: PopupProps['minWidth'];
    maxWidth?: PopupProps['maxWidth'];
    tooltip?: PopupProps['tooltip'];
    view?: PopupProps['view'];
}>`
    position: relative;

    background: ${backgroundColor};

    border-radius: 4px;

    ${({ tooltip }) =>
        tooltip &&
        css`
            font-size: 14px;
            font-weight: 500;
        `}

    ${({ view }) =>
        view === 'danger' &&
        css`
            background-color: ${popupDangerBackgroundColor};
        `}

    ${({ view }) =>
        view === 'warning' &&
        css`
            background-color: ${popupWarningBackgroundColor};
        `}

    ${({ overflow }) =>
        overflow
            ? css`
                  overflow: hidden;
              `
            : css`
                  padding: 4px 8px;
              `}



    ${({ maxWidth }) =>
        maxWidth &&
        css`
            max-width: ${maxWidth}px;
        `}

    &[data-placement^='top'] > ${StyledPopupArrow} {
        bottom: -4px;
    }

    &[data-placement^='top-start'] > ${StyledPopupArrow} {
        left: 4px;
    }

    &[data-placement^='bottom'] > ${StyledPopupArrow} {
        top: -4px;
    }

    &[data-placement^='left'] > ${StyledPopupArrow} {
        right: -4px;
    }

    &[data-placement^='right'] > ${StyledPopupArrow} {
        left: -4px;
    }
`;

/**
 * @see https://github.com/atomiks/tippyjs-react
 * Styling https://popper.js.org/docs/v2/tutorial/#styling
 */
export const Popup: React.FC<PopupProps> = ({
    placement = 'auto',
    children,
    target,
    trigger,
    overflow,
    minWidth,
    maxWidth,
    tooltip,
    view,
    arrow = true,
    ...props
}) => (
    <Tippy
        {...props}
        placement={placement}
        render={(attrs) => (
            <StyledPopupContainer
                minWidth={minWidth}
                maxWidth={maxWidth}
                overflow={overflow}
                tooltip={tooltip}
                view={view}
                tabIndex={-1}
                {...attrs}
            >
                <StyledPopupContent>{children}</StyledPopupContent>

                {arrow && <StyledPopupArrow data-popper-arrow />}
            </StyledPopupContainer>
        )}
        popperOptions={{
            modifiers: [
                {
                    name: 'offset',
                    options: {
                        // https://popper.js.org/docs/v2/tutorial/#offset
                        offset: [-10, 8],
                    },
                },
            ],
        }}
    >
        {target}
    </Tippy>
);
