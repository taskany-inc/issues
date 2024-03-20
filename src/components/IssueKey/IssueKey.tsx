import { Text } from '@taskany/bricks/harmony';

import s from './IssueKey.module.css';

interface IssueKeyProps {
    id: string;
    size?: React.ComponentProps<typeof Text>['size'];
    children?: React.ReactNode;
}

export const IssueKey: React.FC<IssueKeyProps> = ({ id, size = 'm', children }) => {
    return (
        <Text size={size} weight="bold" className={s.IssueKey}>
            #{id} {children}
        </Text>
    );
};
