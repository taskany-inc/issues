import React from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { Link, Text } from '@taskany/bricks';
import { gray9 } from '@taskany/colors';
import { IconQuestionCircleOutline, iconSizesMap } from '@taskany/icons';

import { routes } from '../../hooks/router';
import { AvailableHelpPages } from '../../types/help';

interface HelpButtonProps {
    slug: AvailableHelpPages;
    size?: keyof typeof iconSizesMap | number;
    color?: string;
}

const StyledIconQuestionCircleOutline = styled(IconQuestionCircleOutline)`
    display: flex;
`;

export const HelpButton = React.memo(({ slug, size = 's', color = gray9 }: HelpButtonProps) => (
    <Text color={color}>
        <NextLink passHref href={routes.help(slug)} legacyBehavior>
            <Link inline>
                <StyledIconQuestionCircleOutline size={size} />
            </Link>
        </NextLink>
    </Text>
));
