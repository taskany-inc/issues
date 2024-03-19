import styled from 'styled-components';
import { gapS, gapXs, gray4, gray9, textColor } from '@taskany/colors';
import { Text, nullable } from '@taskany/bricks';
import { IconEdgeOutline } from '@taskany/icons';

interface IssueMetaProps {
    title?: string;
    children?: React.ReactNode;

    onEdit?: () => void | null;
    className?: string;
}

const StyledIssueMeta = styled.div`
    padding: ${gapS} 0;
    max-width: 300px;
`;

const StyledIssueMetaTitle = styled(Text)`
    border-bottom: 1px solid ${gray4};
    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-bottom: ${gapXs};
    max-width: 300px;
`;

const EditButton = styled.span`
    display: inline-block;

    cursor: pointer;

    transition: color 250ms ease-in-out;

    &:hover {
        color: ${textColor};
    }
`;

export const IssueMeta: React.FC<IssueMetaProps> = ({ title, onEdit, children, ...rest }) => {
    return (
        <StyledIssueMeta {...rest}>
            {nullable(title, (t) => (
                <StyledIssueMetaTitle size="s" weight="bold" color={gray9}>
                    {t}{' '}
                    {nullable(onEdit, () => (
                        <EditButton>
                            <IconEdgeOutline size="s" onClick={onEdit} />
                        </EditButton>
                    ))}
                </StyledIssueMetaTitle>
            ))}

            {children}
        </StyledIssueMeta>
    );
};
