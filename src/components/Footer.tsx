import styled from 'styled-components';
import { TaskanyLogo } from './TaskanyLogo';

const StyledFooter = styled.footer`
    padding: 20px 20px;
    display: flex;
    justify-content: start;
    min-height: 20px;
`;

const StyledFooterText = styled.span`
    font-weight: 400;
    color: rgba(255, 255, 255, 0.6);
`;

export const Footer: React.FC = () => {

    return (
        <>
            <StyledFooter>
                <TaskanyLogo />
                <StyledFooterText>{`© ${new Date().getFullYear()} Taskany, Inc.`}</StyledFooterText>
            </StyledFooter>
        </>
    );
};
