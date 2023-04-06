import styled from 'styled-components';
import { gapM, gapS } from '@taskany/colors';

import { Text } from './Text';

export const FormTitle = styled(Text)`
    padding: ${gapS} 0 ${gapM};
`;

FormTitle.defaultProps = {
    size: 'xl',
    weight: 'bolder',
};
