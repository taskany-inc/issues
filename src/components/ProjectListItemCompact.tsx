import React, { MouseEventHandler } from 'react';
import NextLink from 'next/link';
import styled from 'styled-components';
import { TableRow, TableCell, nullable } from '@taskany/bricks';
import { gapS, gapXs, radiusM } from '@taskany/colors';
import { IconUsersOutline } from '@taskany/icons';

import { routes } from '../hooks/router';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

import { UserGroup } from './UserGroup';
import { TitleContainer, Title, TextItem } from './Table';

interface ProjectListItemCompactProps {
    id: string;
    title: string;
    owner?: ActivityByIdReturnType;
    focused?: boolean;
    icon?: boolean;
    className?: string;
    onClick?: MouseEventHandler<HTMLDivElement>;
}

const StyledRow = styled(TableRow)`
    padding: ${gapXs} ${gapS};
    border-radius: ${radiusM};
    cursor: pointer;
`;

export const ProjectListItemCompact: React.FC<ProjectListItemCompactProps> = React.memo(
    ({ id, owner, title, icon, ...attrs }) => {
        return (
            <NextLink href={routes.project(id)} passHref legacyBehavior>
                <StyledRow interactive align="center" gap={10} {...attrs}>
                    {nullable(icon, () => (
                        <TableCell min>
                            <IconUsersOutline size="s" />
                        </TableCell>
                    ))}
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
