import { nullable } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';
import cn from 'classnames';

import s from './IssueMeta.module.css';

interface IssueMetaProps {
    title?: string;
    children?: React.ReactNode;

    className?: string;
}

export const IssueMeta: React.FC<IssueMetaProps> = ({ title, children, className, ...rest }) => {
    return (
        <div className={cn(s.IssueMeta, className)} {...rest}>
            {nullable(title, (t) => (
                <Text size="m" weight="bold" className={s.IssueMetaTitle}>
                    {t}
                </Text>
            ))}

            {children}
        </div>
    );
};
