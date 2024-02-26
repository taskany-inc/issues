import React, { ComponentProps } from 'react';
import { Link } from '@taskany/bricks/harmony';
import { IconQuestionCircleSolid } from '@taskany/icons';

import { routes } from '../../hooks/router';
import { AvailableHelpPages } from '../../types/help';

import s from './HelpButton.module.css';

interface HelpButtonProps {
    slug: AvailableHelpPages;
    size?: ComponentProps<typeof IconQuestionCircleSolid>['size'];
}

export const HelpButton = React.memo(({ slug, size = 20 }: HelpButtonProps) => (
    <Link href={routes.help(slug)} className={s.Circle}>
        <IconQuestionCircleSolid size={size} className={s.Icon} />
    </Link>
));
