import styled, { css } from 'styled-components';

import { formInputBackgroundColor, textColorPrimary } from '../design/@generated/themes';

interface FormActionsProps {
    style?: React.CSSProperties;
    flat?: 'top' | 'bottom';
}

const StyledFormActions = styled(({ flat, ...props }) => <div {...props} />)`
    border-radius: 4px;
    background-color: ${formInputBackgroundColor};
    color: ${textColorPrimary};
    padding: 8px 10px 12px 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    ${({ flat }) =>
        flat === 'top' &&
        css`
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        `}

    ${({ flat }) =>
        flat === 'bottom' &&
        css`
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        `}
`;

export const StyledFormActionRight = styled.div`
    display: flex;
    justify-content: flex-end;
`;

// TODO: rewrite with Grid.Container
export const FormActionRight: React.FC = ({ children }) => (
    <StyledFormActionRight>
        <div>{children}</div>
    </StyledFormActionRight>
);

export const StyledFormActionLeft= styled.div`
    display: flex;
    justify-content: flex-start;
`;

export const FormActionLeft: React.FC = ({ children }) => (
    <StyledFormActionLeft>
        <div>{children}</div>
    </StyledFormActionLeft>
);

export const FormActions: React.FC<FormActionsProps> = (props) => {
    return <StyledFormActions {...props} />;
};
