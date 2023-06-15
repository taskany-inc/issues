import styled from 'styled-components';
import { Button } from '@taskany/bricks';
import { gapM, gapS } from '@taskany/colors';

import { tr } from './LoadMoreButton.i18n';

const StyledLoadContainer = styled.div`
    padding: ${gapM} ${gapS};
`;

export const LoadMoreButton = (props: React.ComponentProps<typeof Button>) => (
    <StyledLoadContainer>
        <Button {...props} text={tr('Load more...')} />
    </StyledLoadContainer>
);
