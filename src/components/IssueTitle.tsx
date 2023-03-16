import React from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';

import { Text } from '@common/Text';

import { gapS } from '../design/@generated/themes';

import { Link } from './Link';

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
        <StyledIssueTitleText forwardRef={ref} size={size} weight="bolder">
            {href ? (
                <NextLink href={href} passHref>
                    <Link inline>{title}</Link>
                </NextLink>
            ) : (
                title
            )}
        </StyledIssueTitleText>
    );
});
