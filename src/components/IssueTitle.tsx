import React from 'react';
import { Text, Link } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { goalPageHeaderTitle } from '../utils/domObjects';

interface IssueTitleProps {
    title: string;
    href?: string;
    size?: React.ComponentProps<typeof Text>['size'];
}

export const IssueTitle = React.forwardRef<HTMLDivElement, IssueTitleProps>(({ title, href, size = 'xxl' }, ref) => {
    return (
        <Text ref={ref} size={size} weight="bolder" {...goalPageHeaderTitle.attr}>
            {nullable(
                href,
                (h) => (
                    <Link href={h} view="primary">
                        {title}
                    </Link>
                ),
                title,
            )}
        </Text>
    );
});
