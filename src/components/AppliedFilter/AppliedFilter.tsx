import React, { ComponentProps, ReactNode } from 'react';
import { Tag, Text } from '@taskany/bricks/harmony';
import cn from 'classnames';

import s from './AppliedFilter.module.css';

interface AppliedFilterProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    label?: string;
    readOnly?: boolean;
    action?: ComponentProps<typeof Tag>['action'];
    color?: ComponentProps<typeof Tag>['color'];
    children?: ReactNode;
}

export const AppliedFilter = ({ className, label, action, readOnly, children, ...props }: AppliedFilterProps) => {
    return (
        <Tag
            className={cn(s.AppliedFilter, { [s.AppliedFilter_readOnly]: readOnly }, className)}
            action={action}
            {...props}
        >
            <Text className={s.AppliedFilterLabel}>{label}</Text>
            <div className={s.AppliedFilterValue}>{children}</div>
        </Tag>
    );
};
