import cn from 'classnames';

import s from './PageActions.module.css';

interface PageActionsProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;

    className?: string;
}

export const PageActions: React.FC<PageActionsProps> = ({ children, className, ...attrs }) => (
    <div className={cn(s.PageActions, className)} {...attrs}>
        {children}
    </div>
);
