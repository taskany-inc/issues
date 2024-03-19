import { HTMLAttributes } from 'react';
import cn from 'classnames';
import { FormCard } from '@taskany/bricks';

import s from './SettingsContent.module.css';

type SettingsCardViewType = 'default' | 'warning' | 'danger';

const colorsMap: Record<SettingsCardViewType, string> = {
    default: s.SettingsCard_default,
    warning: s.SettingsCard_warning,
    danger: s.SettingsCard_danger,
};

interface SettingsCardProps extends HTMLAttributes<HTMLDivElement> {
    view?: SettingsCardViewType;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ view = 'default', children, className, ...attrs }) => (
    <FormCard className={cn(s.SettingsCard, colorsMap[view], className)} {...attrs}>
        {children}
    </FormCard>
);

export const SettingsContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...attrs }) => {
    return (
        <div className={cn(s.SettingsContent, className)} {...attrs}>
            <div>{children}</div>
        </div>
    );
};
