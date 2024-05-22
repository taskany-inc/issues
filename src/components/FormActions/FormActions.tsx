import cn from 'classnames';
import { HTMLAttributes } from 'react';

import s from './FormActions.module.css';

type Align = 'left' | 'right' | 'space-between';

interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
    align?: Align;
}

const alignClasses = {
    left: s.FormActions_left,
    right: s.FormActions_right,
    'space-between': s.FormActions_spaceBetween,
};

export const FormActions = ({ children, align = 'right', className, ...props }: FormActionsProps) => (
    <div className={cn(s.FormActions, alignClasses[align], className)} {...props}>
        {children}
    </div>
);

export const FormAction = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn(s.FormAction, className)} {...props}>
        {children}
    </div>
);
