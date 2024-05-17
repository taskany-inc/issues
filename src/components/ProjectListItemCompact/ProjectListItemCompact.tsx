import React from 'react';
import NextLink from 'next/link';
import cn from 'classnames';
import { TableCell, TableRow, UserGroup } from '@taskany/bricks/harmony';

import { routes } from '../../hooks/router';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { TableRowItemText, TableRowItemTitle } from '../TableRowItem/TableRowItem';
import { safeUserData } from '../../utils/getUserName';

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
                        <TableRowItemTitle>{title}</TableRowItemTitle>
                    </TableCell>
                    <TableCell width="25%">
                        <TableRowItemText>{id}</TableRowItemText>
                    </TableCell>
                    <TableCell>
                        <UserGroup users={[owner].map(safeUserData).filter(Boolean)} />
                    </TableCell>
                </TableRow>
            </NextLink>
        );
    },
);
