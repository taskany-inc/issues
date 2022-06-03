import styled from 'styled-components';

import { gray4, gray8 } from '../design/@generated/themes';

import { Text } from './Text';

interface CardProps {
    info?: React.ReactNode;
    addons?: React.ReactNode;
}

const StyledCard = styled.div`
    position: relative;
    overflow: hidden;
    border: 1px solid ${gray4};
    border-radius: 6px;
    min-height: 180px;
`;

const StyledCardContent = styled.div`
    padding: 12px 20px;
`;

const StyledCardInfo = styled.div`
    padding: 4px 20px;
    background-color: ${gray4};
`;

export const Card: React.FC<CardProps> = ({ info, children }) => {
    return (
        <StyledCard>
            {info ? (
                <StyledCardInfo>
                    <Text size="xs" weight="bold" color={gray8}>
                        {info}
                    </Text>
                </StyledCardInfo>
            ) : null}
            <StyledCardContent>{children}</StyledCardContent>
        </StyledCard>
    );
};
