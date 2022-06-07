import styled from 'styled-components';

import { gray4, gray8 } from '../design/@generated/themes';

import { Text } from './Text';

interface CardProps {
    info?: React.ReactNode;
    addons?: React.ReactNode;
}

const StyledCard = styled.div`
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    border: 1px solid ${gray4};
    border-radius: 6px;
    min-height: 180px;
`;

const StyledCardContent = styled.div`
    box-sizing: border-box;
    padding: 12px 14px;
`;

const StyledCardInfo = styled.div`
    box-sizing: border-box;
    padding: 4px 14px;
    background-color: ${gray4};
`;

export const CardActions = styled.div`
    box-sizing: border-box;
    position: absolute;
    width: 100%;
    bottom: 0;
    left: 0;
    padding: 20px 12px 10px;
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
