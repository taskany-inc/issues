import React, { useCallback } from 'react';
import styled from 'styled-components';
import { CleanButton } from '@taskany/bricks';

import { Goal } from '../../graphql/@generated/genql';
import { nullable } from '../utils/nullable';

import { IssueListItem } from './IssueListItem';
import { IssueMeta } from './IssueMeta';

interface IssueDependenciesListProps {
    title: string;
    dependencies?: Array<Goal | undefined>;

    onEdit?: () => void;
    onDelete?: (id: string) => void;
}

const StyledCleanButton = styled(CleanButton)`
    top: 12px;
    right: -4px;
`;

const StyledDependency = styled.span`
    position: relative;
    display: inline-block;

    &:hover {
        ${StyledCleanButton} {
            visibility: visible;

            cursor: pointer;
        }
    }
`;

export const IssueDependenciesList: React.FC<IssueDependenciesListProps> = ({
    dependencies,
    title,
    onDelete,
    onEdit,
}) => {
    const onDependencyDelete = useCallback(
        (id: string) => () => {
            onDelete && onDelete(id);
        },
        [onDelete],
    );

    return (
        <>
            {nullable(dependencies?.length, () => (
                <IssueMeta title={title} onEdit={onEdit}>
                    {dependencies?.map((d) =>
                        nullable(d, (dep) => (
                            <React.Fragment key={d?.id}>
                                <StyledDependency>
                                    {nullable(onDelete, () => (
                                        <StyledCleanButton onClick={onDependencyDelete(dep.id)} />
                                    ))}
                                    <IssueListItem issue={dep} />
                                </StyledDependency>
                                <br />
                            </React.Fragment>
                        )),
                    )}
                </IssueMeta>
            ))}
        </>
    );
};
