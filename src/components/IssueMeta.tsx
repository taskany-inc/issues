import styled from 'styled-components';

import { gapM, gapS, gray4, gray9 } from '../design/@generated/themes';

import { Text } from './Text';
import { Plus } from './Plus';

interface IssueMetaProps {
    title: string;
    onAdd?: () => void;
}

const StyledIssueMeta = styled.div`
    padding: ${gapS} ${gapM};
    max-width: 300px;
`;
const StyledIssueMetaTitle = styled(Text)`
    border-bottom: 1px solid ${gray4};
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

export const IssueMeta: React.FC<IssueMetaProps> = ({ title, onAdd, children }) => {
    return (
        <StyledIssueMeta>
            <StyledIssueMetaTitle size="s" weight="bold" color={gray9}>
                {title} <Plus onClick={onAdd} />
            </StyledIssueMetaTitle>

            {children}
        </StyledIssueMeta>
    );
};
