import styled from 'styled-components';

interface TipProps {
    title?: string;
    icon?: React.ReactNode;
}

const StyledTip = styled.div`
    padding: 12px 0;
    font-size: 13px;
`;

const StyledTipIcon = styled.span`
    display: inline-block;
    vertical-align: middle;
    margin-right: 6px;
`;

const StyledTipTitle = styled.span`
    font-weight: 600;
    margin-right: 6px;
`;

const StyledTipText = styled.span``;

export const Tip: React.FC<TipProps> = ({ children, title, icon }) => {
    return (
        <StyledTip>
            {icon && <StyledTipIcon>{icon}</StyledTipIcon>}
            {title && <StyledTipTitle>{title}</StyledTipTitle>}
            <StyledTipText>{children}</StyledTipText>
        </StyledTip>
    );
};
