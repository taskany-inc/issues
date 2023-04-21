import React, { useCallback } from 'react';
import styled from 'styled-components';
import { CleanButton, nullable } from '@taskany/bricks';

import { Goal, enumDependency } from '../../../graphql/@generated/genql';
import { IssueListItem } from '../IssueListItem';
import { IssueMeta } from '../IssueMeta';

import { tr } from './IssueDependenciesList.i18n';

interface IssueDependenciesListItemProps {
    title: string;
    dependencies?: Array<Goal | undefined>;
    type: keyof typeof enumDependency;

    onEdit?: () => void;
    onDelete?: (id: Goal['id'], type: IssueDependenciesListItemProps['type']) => void;
}

interface IssueDependenciesListPropsV2 {
    issue: Goal;
    onEdit?: () => void;
    onDelete?: (id: Goal['id'], type: IssueDependenciesListItemProps['type']) => void;
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
    type,
    title,
    onDelete,
    onEdit,
}) => {
    const onDependencyDelete = useCallback(
        (id: string) => () => {
            onDelete && onDelete(id, type);
        },
        [onDelete, type],
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

const depsLinkType = {
    [enumDependency.blocks]: tr('blocks'),
    [enumDependency.dependsOn]: tr('dependsOn'),
    [enumDependency.relatedTo]: tr('relatedTo'),
};

export const IssueDependenciesList: React.FC<IssueDependenciesListPropsV2> = ({ issue, onDelete, onEdit }) => {
    return (
        <>
            {Object.values(enumDependency).map((dependency) => (
                <IssueDependenciesListItem
                    key={dependency}
                    type={dependency}
                    title={depsLinkType[dependency]}
                    dependencies={issue[dependency]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </>
    );
};
