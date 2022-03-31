import styled from 'styled-components';

import { cardBorderColor } from '../design/@generated/themes';

const StyledCard = styled.div`
    padding: 10px 12px;
    border: 1px solid ${cardBorderColor};
    border-radius: 6px;
`;

export const Card: React.FC<{ style?: React.CSSProperties }> = (props) => {
    return (
        <StyledCard {...props} />
    );
}
