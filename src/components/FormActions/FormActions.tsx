import cn from 'classnames';
import { HTMLAttributes } from 'react';

import s from './FormActions.module.css';

export const FormActions = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn(s.FormActions, className)} {...props}>
        {children}
    </div>
);
