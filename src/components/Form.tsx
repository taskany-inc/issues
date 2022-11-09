import styled from 'styled-components';

import { gray3 } from '../design/@generated/themes';
import { useKeyboard } from '../hooks/useKeyboard';

interface FormProps {
    children: React.ReactNode;
    submitHotkey?: Array<number>;

    onSubmit?: () => void;
}

const StyledFormContainer = styled.div`
    background-color: ${gray3};
`;

export const Form: React.FC<FormProps> = ({ onSubmit, submitHotkey, children }) => {
    const handleSubmit = (e?: React.SyntheticEvent) => {
        e?.preventDefault();

        if (onSubmit) onSubmit();
    };

    const [keyboard] = useKeyboard(submitHotkey || [], () => handleSubmit(), {
        disableGlobalEvent: false,
        capture: true,
    });

    return (
        <StyledFormContainer {...keyboard}>
            <form onSubmit={handleSubmit}>{children}</form>
        </StyledFormContainer>
    );
};
