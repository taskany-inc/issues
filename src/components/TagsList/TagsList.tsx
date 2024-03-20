import { PropsWithChildren } from 'react';
import cn from 'classnames';

import s from './TagsList.module.css';

export const TagsList = ({ children, className, ...props }: PropsWithChildren<{ className?: string }>) => {
    return (
        <div className={cn(s.TagsList, className)} {...props}>
            {children}
        </div>
    );
};
