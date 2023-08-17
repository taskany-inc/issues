import React, { ReactNode, useMemo } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { gapXs, gray4, radiusM } from '@taskany/colors';
import { Table, Text, nullable } from '@taskany/bricks';
import { IconServersOutline } from '@taskany/icons';

import { ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { CollapsableItem, CollapsableContentItem } from '../CollapsableItem';
import { ProjectListItem } from '../ProjectListItem';
import { WrappedRowLink } from '../WrappedRowLink';

const StyledGoalsListContainer = styled(Table)<{ children?: React.ReactNode }>`
    background-color: ${gray4};
    border-radius: ${radiusM};
    margin: 0px;
    padding: 0px;
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
        />
    );
};
