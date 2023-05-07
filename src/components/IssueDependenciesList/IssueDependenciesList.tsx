import React, { useCallback } from 'react';
import styled from 'styled-components';
import { CleanButton, nullable } from '@taskany/bricks';

import { IssueListItem } from '../IssueListItem';
import { IssueMeta } from '../IssueMeta';
import { dependencyKind } from '../../schema/goal';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';

import { tr } from './IssueDependenciesList.i18n';

interface IssueDependenciesListProps {
    issue: GoalByIdReturnType;

    onEdit?: () => void;
    onDelete?: (id: string, kind: dependencyKind) => void;
}
interface IssueDependenciesListItemProps {
    title: string;
    dependencies?: GoalByIdReturnType[];
    kind: dependencyKind;

    onEdit?: () => void;
    onDelete?: (id: string, kind: dependencyKind) => void;
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

export const IssueDependenciesListItem: React.FC<IssueDependenciesListItemProps> = ({
    dependencies,
    kind,
    title,
    onDelete,
    onEdit,
}) => {
    const onDependencyDelete = useCallback(
        (id: string) => () => {
            onDelete && onDelete(id, kind);
        },
        [kind, onDelete],
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

export const IssueDependenciesList: React.FC<IssueDependenciesListProps> = ({ issue, onDelete, onEdit }) => {
    return (
        <>
            {Object.values(dependencyKind).map((kind) => (
                <IssueDependenciesListItem
                    key={kind}
                    kind={kind}
                    title={tr(dependencyKind[kind])}
                    dependencies={issue?.[kind] as GoalByIdReturnType[]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </>
    );
};
