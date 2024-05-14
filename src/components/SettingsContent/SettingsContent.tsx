import cn from 'classnames';
import { HTMLAttributes, ReactNode } from 'react';
import { FormCard } from '@taskany/bricks';

import s from './SettingsContent.module.css';

const colorsMap = {
    default: s.SettingsCard_view_default,
    warning: s.SettingsCard_view_warning,
    danger: s.SettingsCard_view_danger,
};

interface SettingsCardProps {
    className?: string;
    children?: ReactNode;
    view?: keyof typeof colorsMap;
}

export const SettingsCard = ({ view = 'default', className, children, ...props }: SettingsCardProps) => {
    return (
        <FormCard className={cn(s.SettingsCard, colorsMap[view], className)} {...props}>
            {children}
        </FormCard>
    );
};

export const SettingsCardItem: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...attrs }) => (
    <div className={cn(className, s.SettingsCardItem)} {...attrs}>
        {children}
    </div>
);

export const SettingsContent: React.FC<{ children: React.ReactNode }> = ({ children, ...attrs }) => {
    return (
        <div className={s.SettingsPageContent} {...attrs}>
            <div>{children}</div>
        </div>
    );
};
