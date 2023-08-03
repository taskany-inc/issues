import React, { MouseEventHandler } from 'react';
import NextLink from 'next/link';
import styled from 'styled-components';
import { ProjectIcon, TableRow, TableCell } from '@taskany/bricks';
import { gapS, gapXs, radiusM } from '@taskany/colors';

import { routes } from '../hooks/router';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

import { UserGroup } from './UserGroup';
import { TitleContainer, Title, TextItem } from './Table';

interface ProjectListItemCompactProps {
    id: string;
    title: string;
    owner?: ActivityByIdReturnType;
    focused?: boolean;
    className?: string;
    onClick?: MouseEventHandler<HTMLDivElement>;
}

const StyledRow = styled(TableRow)`
    padding: ${gapXs} ${gapS};
    border-radius: ${radiusM};
    cursor: pointer;
`;

export const ProjectListItemCompact: React.FC<ProjectListItemCompactProps> = React.memo(
    ({ id, owner, title, focused, className, onClick }) => {
        return (
            <NextLink href={routes.project(id)} passHref legacyBehavior>
                <StyledRow
                    interactive
                    focused={focused}
                    onClick={onClick}
                    className={className}
                    align="center"
                    gap={10}
                >
                    <TableCell min>
                        <ProjectIcon size="s" />
                    </TableCell>
                    <TableCell col={6.5}>
                        <TitleContainer>
                            <Title size="s" weight="bold">
                                {title}
                            </Title>
                        </TitleContainer>
                    </TableCell>
                    <TableCell col={3}>
                        <TextItem>{id}</TextItem>
                    </TableCell>
                    <TableCell align="center">
                        <UserGroup users={[owner] as NonNullable<ActivityByIdReturnType>[]} />
                    </TableCell>
                </StyledRow>
            </NextLink>
        );
    },
);
