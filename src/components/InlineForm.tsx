import { Form, KeyCode, useClickOutside, useKeyboard } from '@taskany/bricks';
import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import styled from 'styled-components';

interface RenderTriggerProps {
    onClick: () => void;
}

interface InlineFormProps {
    renderTrigger?: (props: RenderTriggerProps) => React.ReactNode;
    onSubmit: () => void;
    children: React.ReactNode;
    onReset: () => void;
    isSubmitted?: boolean;
    className?: string;
}

const StyledWrapper = styled.div`
    display: flex;
`;

const StyledFormWrapper = styled.div`
    display: flex;
    flex-wrap: nowrap;
    position: relative;
`;

export const InlineForm: React.FC<InlineFormProps> = ({
    renderTrigger,
    onSubmit,
    onReset,
    isSubmitted,
    children,
    className,
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [visible, toggle] = useReducer((state) => !state, !renderTrigger);
    const trigger = useMemo(() => {
        if (typeof renderTrigger === 'function') {
            return renderTrigger({ onClick: toggle });
        }

        return null;
    }, [renderTrigger]);

    const [onESC] = useKeyboard(
        [KeyCode.Escape],
        () => {
            if (visible) {
                toggle();
            }
        },
        {
            event: 'keyup',
        },
    );

    useClickOutside(wrapperRef, () => {
        if (visible) {
            toggle();
        }
    });

    useEffect(() => {
        if (isSubmitted) {
            toggle();
            onReset();
        }
    }, [onReset, isSubmitted]);

    useEffect(() => {
        if (!visible) {
            onReset();
        }
    }, [visible, onReset]);

    return (
        <StyledWrapper ref={wrapperRef} className={className}>
            {!visible && trigger}
            {visible && (
                <Form {...onESC} onSubmit={() => onSubmit()} submitHotkey={[KeyCode.Enter]}>
                    <StyledFormWrapper>{children}</StyledFormWrapper>
                </Form>
            )}
        </StyledWrapper>
    );
};