import React from 'react';
import styled from 'styled-components';

import { gapS } from '../design/@generated/themes';

import { Text } from './Text';

interface IssueTitleProps {
    title: string;
    size?: React.ComponentProps<typeof Text>['size'];
}

const StyledIssueTitleText = styled(({ forwardRef, ...props }) => <Text forwardRef={forwardRef} {...props} />)`
    padding-top: ${gapS};
    padding-bottom: ${gapS};
`;

export const IssueTitle = React.forwardRef<HTMLDivElement, IssueTitleProps>(({ title, size = 'xxl' }, ref) => {
    return (
        <StyledIssueTitleText forwardRef={ref} size={size} weight="bolder">
            {title}
        </StyledIssueTitleText>
    );
});
