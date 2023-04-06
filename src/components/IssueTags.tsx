import styled from 'styled-components';
import { gapS } from '@taskany/colors';

import { Tag as TagModel } from '../../graphql/@generated/genql';
import { nullable } from '../utils/nullable';

import { Tag } from './Tag';

interface IssueTagsProps {
    tags: Array<TagModel | undefined>;
    size?: React.ComponentProps<typeof Tag>['size'];
}

const StyledIssueTags = styled.span`
    padding-left: ${gapS};
`;

export const IssueTags: React.FC<IssueTagsProps> = ({ tags, size = 'm' }) => (
    <StyledIssueTags>
        {tags?.map((tag) =>
            nullable(tag, (t) => <Tag key={t.id} size={size} title={t.title} description={t.description} />),
        )}
    </StyledIssueTags>
);
