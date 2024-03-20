import React from 'react';
import NextLink from 'next/link';
import cn from 'classnames';
import { TableCell, TableRow } from '@taskany/bricks/harmony';

import { routes } from '../../hooks/router';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { UserGroup } from '../UserGroup';
import { Title, TextItem } from '../Table/Table';

import s from './ProjectListItemCompact.module.css';

interface ProjectListItemCompactProps {
    id: string;
    title: string;
    owner?: ActivityByIdReturnType;
    className?: string;
}

export const ProjectListItemCompact: React.FC<ProjectListItemCompactProps> = React.memo(
    ({ id, owner, title, className }) => {
        return (
            <NextLink href={routes.project(id)} passHref legacyBehavior>
                <TableRow className={cn(s.ProjectListItemCompactRow, className)}>
                    <TableCell width="55%">
                        <Title size="s">{title}</Title>
                    </TableCell>
                    <TableCell width="25%">
                        <TextItem>{id}</TextItem>
                    </TableCell>
                    <TableCell>
                        <UserGroup users={[owner] as NonNullable<ActivityByIdReturnType>[]} />
                    </TableCell>
                </TableRow>
            </NextLink>
        );
    },
);
