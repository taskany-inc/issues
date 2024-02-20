import styled from 'styled-components';
import { Button } from '@taskany/bricks/harmony';

import { tr } from './LoadMoreButton.i18n';

const StyledLoadContainer = styled.div`
    padding: var(--gap-m) var(--gap-s);
`;

export const LoadMoreButton = (props: React.ComponentProps<typeof Button>) => (
    <StyledLoadContainer>
        <Button {...props} text={tr('Load more...')} />
    </StyledLoadContainer>
);
