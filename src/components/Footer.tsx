import styled from 'styled-components';
import { SheepLogo } from './SheepLogo';

const StyledFooter = styled.footer`
    padding: 20px 20px;
    display: flex;
    justify-content: start;
    max-height: 60px;
`;

const StyledFooterText = styled.span`
    font-weight: 400;
    color: rgba(255, 255, 255, 0.6);
`;

export const Footer: React.FC = () => {
    return (
        <>
            <StyledFooter>
                <StyledFooterText>
                    {`© ${new Date().getFullYear()} Taskany, Inc.`}
                        <SheepLogo />
                </StyledFooterText>
            </StyledFooter>
        </>
    );
};
