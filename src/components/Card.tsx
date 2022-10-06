import styled from 'styled-components';

import { gray4, gray8, radiusM } from '../design/@generated/themes';

import { Text } from './Text';

export const Card = styled.div`
    position: relative;
    box-sizing: border-box;
    min-height: 150px;

    border: 1px solid ${gray4};
    border-radius: ${radiusM};
`;

export const CardContent = styled.div`
    position: relative;
    box-sizing: border-box;
    padding: 12px 14px 60px;
`;

const StyledCardInfo = styled(Text)`
    position: relative;
    box-sizing: border-box;
    padding: 4px 14px;

    background-color: ${gray4};

    border-top-left-radius: ${radiusM};
    border-top-right-radius: ${radiusM};
`;

export const CardInfo: React.FC<{ className?: string }> = ({ children, className }) => (
    <StyledCardInfo className={className} size="xs" weight="bold" color={gray8}>
        {children}
    </StyledCardInfo>
);

export const CardActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    position: absolute;
    width: 100%;
    bottom: 0;
    left: 0;
    padding: 20px 12px 10px;
`;
