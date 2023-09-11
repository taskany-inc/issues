import styled from 'styled-components';
import { gapS } from '@taskany/colors';
import { Tag, nullable } from '@taskany/bricks';

interface IssueTagsProps {
    tags: Array<{ id: string; title: string; description?: string | null }>;
    size?: React.ComponentProps<typeof Tag>['size'];
}

const StyledIssueTags = styled.span`
    padding-left: ${gapS};
`;

export const IssueTags: React.FC<IssueTagsProps> = ({ tags, size = 'm' }) =>
    nullable(tags, (t) => (
        <StyledIssueTags>
            {t.map((tag) => (
                <Tag key={tag.id} size={size}>
                    {tag.title}
                </Tag>
            ))}
        </StyledIssueTags>
    ));
