import { Form, KeyCode, QuestionIcon, nullable, useClickOutside, useKeyboard } from '@taskany/bricks';
import Popup from '@taskany/bricks/components/Popup';
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import styled from 'styled-components';

interface RenderTriggerProps {
    onClick: () => void;
}

interface InlineFormProps {
    renderTrigger?: (props: RenderTriggerProps) => React.ReactNode;
    onSubmit: () => void;
    children: React.ReactNode;
    tip?: React.ReactNode;
    onReset: () => void;
    isSubmitted?: boolean;
    className?: string;
}

const StyledWrapper = styled.div`
    display: flex;

    & form {
        background-color: transparent;
    }
`;

const StyledFormWrapper = styled.div`
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    position: relative;
`;

const StyledQuestionIcon = styled(QuestionIcon)`
    margin-left: 4px;
`;

export const InlineForm: React.FC<InlineFormProps> = ({
    renderTrigger,
    onSubmit,
    onReset,
    isSubmitted,
    children,
    tip,
    className,
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [visible, toggle] = useReducer((state) => !state, !renderTrigger);
    const [hintVisible, toggleHintVisible] = useState(false);
    const hintRef = useRef<HTMLAnchorElement>(null);
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
            capture: true,
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
        <StyledWrapper ref={wrapperRef} className={className} {...onESC}>
            {!visible && trigger}
            {visible && (
                <Form onSubmit={onSubmit}>
                    <StyledFormWrapper>
                        {children}
                        {nullable(tip, (t) => (
                            <>
                                <a
                                    ref={hintRef}
                                    onMouseOver={() => toggleHintVisible(true)}
                                    onMouseLeave={() => toggleHintVisible(false)}
                                >
                                    <StyledQuestionIcon size="s" />
                                </a>
                                <Popup reference={hintRef} visible={hintVisible} placement="top-end">
                                    {t}
                                </Popup>
                            </>
                        ))}
                    </StyledFormWrapper>
                </Form>
            )}
        </StyledWrapper>
    );
};
