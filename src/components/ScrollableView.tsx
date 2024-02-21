import React, { useCallback, useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';

import { useForkedRef } from '../hooks/useForkedRef';

export interface OverflowScrollProps {
    className?: string;
    children: React.ReactNode;
}

interface OverflowScrollState {
    left: boolean;
    right: boolean;
}

interface StyledShadeProps {
    position: 'left' | 'right';
    y?: number;
    visible?: boolean;
}

const shadeWidth = 2;

const extendArea = css`
    margin: calc(-1 * var(--gap-m));
    padding: var(--gap-m);
`;

const StyledScrollWrapper = styled.div<OverflowScrollProps>`
    position: relative;
    z-index: 1;

    overflow: hidden;

    scrollbar-width: none;
    ${extendArea};
`;

const StyledScrollContainer = styled.div`
    overflow-y: hidden;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    ${extendArea};
`;

const StyledShade = styled.span<StyledShadeProps>`
    position: absolute;
    z-index: 1;

    top: calc(var(--gap-m) * -1);
    bottom: calc(var(--gap-m) * -1);
    width: ${shadeWidth}px;
    border-radius: 75%;

    ${({ visible = false }) => ({
        visibility: visible ? 'visible' : 'hidden',
        opacity: Number(visible),
    })}
    ${({ position }) => ({
        [`margin-${position}`]: '-1px',
        [position]: 0,

        boxShadow:
            'rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px',
    })}
`;

export const ScrollableView = React.forwardRef<HTMLDivElement, OverflowScrollProps>(({ className, children }, ref) => {
    const [shades, setShades] = useState<OverflowScrollState>({
        left: false,
        right: false,
    });

    const innerRef = useRef<HTMLDivElement>(null);
    const forkedRef = useForkedRef(ref, innerRef);

    const onScrollHandler = useCallback(() => {
        const el = innerRef.current;

        if (el == null) {
            return;
        }

        if (el.clientWidth >= el.scrollWidth) {
            setShades({
                left: false,
                right: false,
            });
        } else {
            setShades({
                left: el.scrollLeft > 0,
                right: el.scrollLeft + el.clientWidth < el.scrollWidth,
            });
        }
    }, []);

    useEffect(() => {
        onScrollHandler();

        window.addEventListener('resize', onScrollHandler, { capture: true });

        return () => {
            window.removeEventListener('resize', onScrollHandler, { capture: true });
        };
    }, [onScrollHandler]);

    return (
        <StyledScrollWrapper className={className} onResizeCapture={onScrollHandler}>
            <StyledShade key={`left-${shades.left}`} position="left" visible={shades.left} />
            <StyledShade key={`right-${shades.right}`} position="right" visible={shades.right} />

            <StyledScrollContainer onScroll={onScrollHandler} ref={forkedRef}>
                {children}
            </StyledScrollContainer>
        </StyledScrollWrapper>
    );
});
