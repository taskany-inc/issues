import React, { useCallback, useReducer } from 'react';
import styled from 'styled-components';
import { nullable } from '@taskany/bricks';

interface ContentToggleProps {
    title: React.ReactNode;
    visible?: boolean;
    children?: React.ReactNode;
    className?: string;

    onShow?: () => void;
    onHide?: () => void;
}

const StyledContentToggle = styled.div``;
const StyledContentToggleTitle = styled.div``;
const StyledContentToggleChildren = styled.div``;

export const ContentToggle: React.FC<ContentToggleProps> = ({
    title,
    visible: defaultVisible = false,
    children,
    className,
    onShow,
    onHide,
}) => {
    const [visible, setVisible] = useReducer((v) => !v, defaultVisible);

    const onClick = useCallback(() => {
        if (!visible && children) {
            setVisible();
            onShow?.();
        } else {
            setVisible();
            onHide?.();
        }
    }, [visible, children, setVisible, onHide, onShow]);

    return (
        <StyledContentToggle className={className}>
            <StyledContentToggleTitle onClick={onClick}>{title}</StyledContentToggleTitle>
            {nullable(visible && children, () => (
                <StyledContentToggleChildren>{children}</StyledContentToggleChildren>
            ))}
        </StyledContentToggle>
    );
};
