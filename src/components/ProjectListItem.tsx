import Link from 'next/link';
import { EyeIcon, StarFilledIcon, Text, nullable } from '@taskany/bricks';
import { FC } from 'react';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

import { Table, TableCell, TableRow } from './Table';
import { UserGroup } from './UserGroup';

interface ProjectListItemProps {
    href: string;
    title: string;
    owner?: ActivityByIdReturnType;
    participants?: ActivityByIdReturnType[];
    starred?: boolean;
    watching?: boolean;
}

export const ProjectListContainer: FC<{ children: React.ReactNode }> = ({ children }) => (
    <Table columns={5}>{children}</Table>
);

export const ProjectListItem: React.FC<ProjectListItemProps> = ({
    title,
    starred,
    watching,
    owner,
    participants,
    href,
}) => (
    <Link href={href} passHref>
        <TableRow>
            <TableCell>
                <Text size="m" weight="bold">
                    {title}
                </Text>
            </TableCell>
            <TableCell>
                {nullable(owner, (o) => (
                    <UserGroup users={[o]} />
                ))}
            </TableCell>
            <TableCell>
                {nullable(participants, (p) => (
                    <UserGroup users={p} />
                ))}
            </TableCell>

            <TableCell>
                {nullable(starred, () => (
                    <StarFilledIcon size="s" />
                ))}
            </TableCell>

            <TableCell>
                {nullable(watching, () => (
                    <EyeIcon size="s" />
                ))}
            </TableCell>
        </TableRow>
    </Link>
);
