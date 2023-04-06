import styled from 'styled-components';
import { gray0 } from '@taskany/colors';

import { SheepLogo } from './SheepLogo';

const StyledFooter = styled.footer`
    display: grid;
    grid-template-columns: 0.25fr 2fr;
    align-items: end;
    padding: 20px 40px;
`;

const StyledFooterText = styled.div`
    color: ${gray0};
`;

export const Footer: React.FC = () => {
    return (
        <StyledFooter>
            <StyledFooterText>{`© ${new Date().getFullYear()} Taskany, Inc.`}</StyledFooterText>

            <SheepLogo />
        </StyledFooter>
    );
};
