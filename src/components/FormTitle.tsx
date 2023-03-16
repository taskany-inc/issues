import styled from 'styled-components';

import { Text } from '@common/Text';

import { gapM, gapS } from '../design/@generated/themes';

export const FormTitle = styled(Text)`
    padding: ${gapS} 0 ${gapM};
`;

FormTitle.defaultProps = {
    size: 'xl',
    weight: 'bolder',
};
