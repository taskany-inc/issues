import styled from 'styled-components';

import { gray6 } from '../design/@generated/themes';

import { Text } from './Text';

interface IssueKeyProps {
    id: string;
}

const StyledIssueKey = styled.div``;

export const IssueKey: React.FC<IssueKeyProps> = ({ id, children }) => {
    return (
        <StyledIssueKey>
            <Text size="m" weight="bold" color={gray6}>
                #{id} {children}
            </Text>
        </StyledIssueKey>
    );
};
