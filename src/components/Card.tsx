import styled from 'styled-components';

import { gray4, gray8, radiusM } from '../design/@generated/themes';

import { Text } from './Text';

export const Card = styled.div`
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    border: 1px solid ${gray4};
    border-radius: ${radiusM};
    min-height: 180px;
`;

export const CardContent = styled.div`
    box-sizing: border-box;
    padding: 12px 14px;
`;

const StyledCardInfo = styled.div`
    box-sizing: border-box;
    padding: 4px 14px;
    background-color: ${gray4};
`;

export const CardInfo: React.FC = ({ children }) => (
    <StyledCardInfo>
        <Text size="xs" weight="bold" color={gray8}>
            {children}
        </Text>
    </StyledCardInfo>
);

export const CardActions = styled.div`
    box-sizing: border-box;
    position: absolute;
    width: 100%;
    bottom: 0;
    left: 0;
    padding: 20px 12px 10px;

    display: flex;
    align-items: center;
`;
