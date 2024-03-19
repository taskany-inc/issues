import { forwardRef } from 'react';
import { Text } from '@taskany/bricks/harmony';
import cn from 'classnames';

import s from './InlineTrigger.module.css';

interface InlineTriggerProps {
    text: React.ReactNode;
    /** recommended props: size="xs" */
    icon: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const InlineTrigger = forwardRef<HTMLDivElement, InlineTriggerProps>(
    ({ text, icon, className, onClick, ...attrs }, ref) => {
        return (
            <Text ref={ref} size="s" className={cn(s.InlineTrigger, className)} onClick={onClick} {...attrs}>
                <span className={s.InlineTriggerIconContainer}>{icon}</span>
                <span className={s.InlineTriggerText}>{text}</span>
            </Text>
        );
    },
);
