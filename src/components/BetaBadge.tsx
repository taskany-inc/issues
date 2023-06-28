import { colorPrimary, gapXs } from '@taskany/colors';
import styled from 'styled-components';

const StyledBetaBadge = styled.span`
    position: absolute;

    color: ${colorPrimary};
    font-weight: 500;
    font-size: 13px;
    padding-left: ${gapXs};
`;

export const BetaBadge = () => <StyledBetaBadge>β</StyledBetaBadge>;
