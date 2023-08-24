import React, { ComponentProps, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { Popup } from '@taskany/bricks';
import { radiusM, gapS, gray5 } from '@taskany/colors';

const arrowDirectionStyles = {
    top: `
        border-top: none;
        border-left: none;
    `,
    bottom: `
        border-bottom: none;
        border-right: none;
    `,
    left: `
        border-bottom: none;
        border-left: none;
    `,
    right: `
        border-top: none;
        border-right: none;
    `,
};

const getArrowStyles = (direction: keyof typeof arrowDirectionStyles) => css`
    &[data-placement|='${direction}'] {
        [data-popper-arrow] {
            &::before {
                border: 1px solid ${gray5};
                ${arrowDirectionStyles[direction]}
            }
        }
    }
`;

const StyledPopup = styled(Popup)`
    border-radius: ${radiusM};
    padding: ${gapS};
    border: 1px solid ${gray5};

    ${getArrowStyles('top')}
    ${getArrowStyles('bottom')}
    ${getArrowStyles('left')}
    ${getArrowStyles('right')}
`;

interface OutlinePopupProps {
    children: ReactNode;
}
export type PopupProps = ComponentProps<typeof Popup>;

export const OutlinePopup: React.FC<OutlinePopupProps & PopupProps> = ({ children, ...props }) => {
    return <StyledPopup {...props}>{children}</StyledPopup>;
};
