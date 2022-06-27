import styled from 'styled-components';

import { gray3 } from '../design/@generated/themes';
import { KeyCode, KeyMod, useKeyboard } from '../hooks/useKeyboard';

interface FormProps {
    onSubmit?: () => void;
}

const StyledFormContainer = styled.div`
    background-color: ${gray3};
`;

export const Form: React.FC<FormProps> = ({ onSubmit, children }) => {
    const handleSubmit = (e?: React.SyntheticEvent) => {
        e?.preventDefault();

        if (onSubmit) onSubmit();
    };

    const [keyboard] = useKeyboard([KeyMod.CtrlCmd, KeyCode.Enter], () => handleSubmit(), {
        disableGlobalEvent: true,
        stopPropagation: true,
    });

    return (
        <StyledFormContainer {...keyboard}>
            <form onSubmit={handleSubmit}>{children}</form>
        </StyledFormContainer>
    );
};
