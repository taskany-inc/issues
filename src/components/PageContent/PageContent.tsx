import cn from 'classnames';

import s from './PageContent.module.css';

interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;

    className?: string;
}

export const PageContent: React.FC<PageContentProps> = ({ children, className, ...attrs }) => (
    <div className={cn(s.PageContent, className)} {...attrs}>
        {children}
    </div>
);
