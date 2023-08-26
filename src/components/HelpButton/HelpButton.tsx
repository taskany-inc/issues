import React from 'react';
import NextLink from 'next/link';
import { Link } from '@taskany/bricks';
import { gray9 } from '@taskany/colors';
import { IconQuestionCircleOutline, iconSizesMap } from '@taskany/icons';

import { routes } from '../../hooks/router';
import { AvailableHelpPages } from '../../types/help';

interface HelpButtonProps {
    slug: AvailableHelpPages;
    size?: keyof typeof iconSizesMap | number;
    color?: string;
}

export const HelpButton = React.memo(({ slug, size = 's', color = gray9 }: HelpButtonProps) => (
    <NextLink passHref href={routes.help(slug)} legacyBehavior>
        <Link>
            <IconQuestionCircleOutline size={size} color={color} />
        </Link>
    </NextLink>
));
