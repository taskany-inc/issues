import { nullable } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';
import { IconEdgeOutline } from '@taskany/icons';

import s from './IssueMeta.module.css';

interface IssueMetaProps {
    title?: string;
    children?: React.ReactNode;

    onEdit?: () => void | null;
    className?: string;
}

export const IssueMeta: React.FC<IssueMetaProps> = ({ title, onEdit, children, ...rest }) => {
    return (
        <div className={s.IssueMeta} {...rest}>
            <Text className={s.IssueMetaTitle} size="s" weight="bold">
                {title}{' '}
                {nullable(onEdit, () => (
                    <span className={s.IssueMetaEditButton}>
                        <IconEdgeOutline size="s" onClick={onEdit} />
                    </span>
                ))}
            </Text>

            {children}
        </div>
    );
};
