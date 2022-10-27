import { gray6 } from '../design/@generated/themes';

import { Text } from './Text';

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
