import styled from 'styled-components';

import { gray3 } from '../design/@generated/themes';
import { useKeyboard } from '../hooks/useKeyboard';

interface FormProps {
    children: React.ReactNode;
    submitHotkey?: Array<number>;

    onSubmit?: () => void;
}

const StyledForm = styled.form`
    background-color: ${gray3};
`;

export const Form: React.FC<FormProps> = ({ onSubmit, submitHotkey, children }) => {
    const handleSubmit = (e?: React.SyntheticEvent) => {
        e?.preventDefault();

        onSubmit?.();
    };

    const [keyboard] = useKeyboard(submitHotkey || [], () => handleSubmit(), {
        disableGlobalEvent: false,
        capture: true,
    });

    return (
        <StyledForm {...keyboard} onSubmit={handleSubmit}>
            {children}
        </StyledForm>
    );
};
