import { gray6 } from '../design/@generated/themes';

import { Text } from './Text';

interface IssueKeyProps {
    id: string;
}

export const IssueKey: React.FC<IssueKeyProps> = ({ id, children }) => {
    return (
        <Text size="m" weight="bold" color={gray6}>
            #{id} {children}
        </Text>
    );
};
