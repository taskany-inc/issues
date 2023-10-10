import React from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { gapS } from '@taskany/colors';
import { Text, Link } from '@taskany/bricks';

import { issuePageHeaderTitle } from '../utils/domObjects';

interface IssueTitleProps {
    title: string;
    href?: string;
    size?: React.ComponentProps<typeof Text>['size'];
}

const StyledIssueTitleText = styled(({ forwardRef, ...props }) => <Text forwardRef={forwardRef} {...props} />)`
    padding-top: ${gapS};
    padding-bottom: ${gapS};
`;

export const IssueTitle = React.forwardRef<HTMLDivElement, IssueTitleProps>(({ title, href, size = 'xxl' }, ref) => {
    return (
        <StyledIssueTitleText forwardRef={ref} size={size} weight="bolder" {...issuePageHeaderTitle.attr}>
            {href ? (
                <Link as={NextLink} href={href} inline>
                    {title}
                </Link>
            ) : (
                title
            )}
        </StyledIssueTitleText>
    );
});
