import { FC, HTMLAttributes } from 'react';
import cn from 'classnames';

import s from './Separator.module.css';

export const Separator: FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
    <div className={cn(s.Separator, className)} {...props}>
        {children}
    </div>
);
