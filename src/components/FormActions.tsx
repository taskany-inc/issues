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
    margin-top: -6px; // WTF?

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

export const FormActionRight = styled.div`
    display: flex;
    justify-content: flex-end;
`;

export const FormActions: React.FC<FormActionsProps> = (props) => {
    return <StyledFormActions {...props} />;
};
