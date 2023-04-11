import { gray6 } from '@taskany/colors';
import { Text } from '@taskany/bricks';

interface IssueKeyProps {
    id: string;
    size?: React.ComponentProps<typeof Text>['size'];
    children?: React.ReactNode;
}

export const IssueKey: React.FC<IssueKeyProps> = ({ id, size = 'm', children }) => {
    return (
        <Text size={size} weight="bold" color={gray6}>
            #{id} {children}
        </Text>
    );
};
