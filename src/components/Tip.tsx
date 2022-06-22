import styled from 'styled-components';

import { gapS, gray7 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

import { Text } from './Text';

interface TipProps {
    title?: string;
    icon?: React.ReactNode;
}

const StyledTip = styled(Text)`
    padding: ${gapS} 0;
`;

const StyledTipIcon = styled.span`
    display: inline-block;
    vertical-align: middle;
    margin-right: 6px;
`;

const StyledTipTitle = styled(Text)`
    margin-right: 6px;
`;

export const Tip: React.FC<TipProps> = ({ children, title, icon }) => {
    return (
        <StyledTip size="s" color={gray7}>
            {nullable(icon, (i) => (
                <StyledTipIcon>{i}</StyledTipIcon>
            ))}

            {nullable(title, (t) => (
                <StyledTipTitle as="span" size="s" weight="bold" color={gray7}>
                    {t}
                </StyledTipTitle>
            ))}

            {children}
        </StyledTip>
    );
};
