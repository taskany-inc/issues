import React from 'react';
import NextLink from 'next/link';
import { Link, QuestionIcon, iconSizesMap } from '@taskany/bricks';
import { gray9 } from '@taskany/colors';

import { routes } from '../../hooks/router';
import { AvailableHelpPages } from '../../types/help';

interface HelpButtonProps {
    slug: AvailableHelpPages;
    size?: keyof typeof iconSizesMap | number;
    color?: string;
}

export const HelpButton = React.memo(({ slug, size = 's', color = gray9 }: HelpButtonProps) => (
    <NextLink passHref href={routes.help(slug)}>
        <Link>
            <QuestionIcon size={size} color={color} />
        </Link>
    </NextLink>
));
