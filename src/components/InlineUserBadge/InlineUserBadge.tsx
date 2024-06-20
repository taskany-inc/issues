import { ComponentProps, FC, useRef } from 'react';
import { Tooltip } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { UserBadge } from '../UserBadge/UserBadge';

import s from './InlineUserBadge.module.css';

interface InlineUserBadgeProps extends ComponentProps<typeof UserBadge> {
    tooltip?: string;
}

export const InlineUserBadge: FC<InlineUserBadgeProps> = ({ tooltip, ...props }) => {
    const badgeRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <UserBadge ref={badgeRef} className={s.InlineUserBadge} as="span" {...props} />
            {nullable(tooltip, (t) => (
                <Tooltip arrow reference={badgeRef} placement="top">
                    {t}
                </Tooltip>
            ))}
        </>
    );
};
