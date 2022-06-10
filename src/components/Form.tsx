import styled from 'styled-components';

import { KeyCode, KeyMod, useKeyboard } from '../hooks/useKeyboard';

interface FormProps {
    onSubmit?: () => void;
}

const StyledFormContainer = styled.div``;

export const Form: React.FC<FormProps> = ({ onSubmit, children }) => {
    const handleSubmit = (e?: React.SyntheticEvent) => {
        e?.preventDefault();

        if (onSubmit) onSubmit();
    };

    const [keyboard] = useKeyboard([KeyMod.CtrlCmd, KeyCode.Enter], () => handleSubmit(), {
        disableGlobalEvent: true,
    });

    return (
        <StyledFormContainer {...keyboard}>
            <form onSubmit={handleSubmit}>{children}</form>
        </StyledFormContainer>
    );
};
