import { KeyCode, KeyMod, useKeyboard } from '@geist-ui/core';
import styled from 'styled-components';

interface FormProps {
    onSubmit?: () => void;
}

const StyledFormContainer = styled.div``;

export const Form: React.FC<FormProps> = ({ onSubmit, children }) => {
    const handleSubmit = (e?: React.SyntheticEvent) => {
        e?.preventDefault();

        if (onSubmit) onSubmit();
    };

    const { bindings: keyboardBindings } = useKeyboard(() => handleSubmit(), [KeyMod.CtrlCmd, KeyCode.Enter], {
        disableGlobalEvent: true,
    });

    return (
        <StyledFormContainer {...keyboardBindings}>
            <form onSubmit={handleSubmit}>{children}</form>
        </StyledFormContainer>
    );
};
