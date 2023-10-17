import React, { ReactNode, useMemo } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { gapM, gapS, gapXs, gray4 } from '@taskany/colors';
import { Table, Text, nullable } from '@taskany/bricks';
import { IconServersOutline } from '@taskany/icons';

import { ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { CollapsableItem, CollapsableContentItem } from '../CollapsableItem';
import { ProjectListItem } from '../ProjectListItem';
import { WrappedRowLink } from '../WrappedRowLink';
import { projectListItem, projectListItemTitle } from '../../utils/domObjects';

const StyledGoalsListContainer = styled(Table)<{ children?: React.ReactNode }>`
    margin: 0;
    padding: ${gapS} 0 ${gapM} 0;

    box-sizing: border-box;

    border-top: 1px solid ${gray4};
`;

const StyledProjectIcons = styled.div`
    display: flex;
    align-items: center;
    gap: ${gapXs};
`;

interface ProjectListItemCollapsableProps {
    href?: string;
    project: NonNullable<ProjectByIdReturnType>;
    disabled?: boolean;
    goals?: ReactNode;
    children?: React.ReactNode;
    onClick?: () => void;
    contentHidden: boolean;
    deep?: number;
    projectChidlsLen?: number;
}

const onProjectClickHandler = (e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault();
    } else {
        e.stopPropagation();
    }
};

export const ProjectListItemCollapsable: React.FC<ProjectListItemCollapsableProps> = ({
    project,
    onClick,
    children,
    goals,
    disabled,
    contentHidden,
    deep = 0,
    projectChidlsLen = 0,
    href,
}) => {
    const calculatedDeep = useMemo(() => {
        if (deep > 0) {
            if (contentHidden || !projectChidlsLen) {
                return deep - 1;
            }
        }

        return deep;
    }, [deep, contentHidden, projectChidlsLen]);

    const projectComponent = (
        <ProjectListItem
            title={project.title}
            owner={project.activity}
            participants={project.participants}
            starred={project._isStarred}
            watching={project._isWatching}
            averageScore={project.averageScore}
            onClick={onProjectClickHandler}
            disabled={disabled}
            deep={calculatedDeep}
            {...projectListItemTitle.attr}
        >
            {nullable(projectChidlsLen, (c) => (
                <StyledProjectIcons>
                    <IconServersOutline size="xs" />
                    <Text size="xs">{c}</Text>
                </StyledProjectIcons>
            ))}
        </ProjectListItem>
    );

    return (
        <CollapsableItem
            collapsed={contentHidden}
            onClick={disabled ? undefined : onClick}
            hasChild={projectChidlsLen > 0}
            header={
                <Table>
                    {href ? (
                        <NextLink href={href} passHref legacyBehavior>
                            <WrappedRowLink>{projectComponent}</WrappedRowLink>
                        </NextLink>
                    ) : (
                        projectComponent
                    )}
                </Table>
            }
            content={
                <>
                    <CollapsableContentItem>
                        <StyledGoalsListContainer>{goals}</StyledGoalsListContainer>
                    </CollapsableContentItem>
                    {children}
                </>
            }
            deep={deep}
            {...projectListItem.attr}
        />
    );
};
