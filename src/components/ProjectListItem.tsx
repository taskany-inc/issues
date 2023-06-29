import { FC, ReactNode } from 'react';
import Link from 'next/link';
import { EyeIcon, StarFilledIcon, Text, nullable } from '@taskany/bricks';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

import { Table, TableCell, TableRow } from './Table';
import { UserGroup } from './UserGroup';

interface ProjectListItemProps {
    href?: string;
    children?: ReactNode;
    title: string;
    owner?: ActivityByIdReturnType;
    participants?: ActivityByIdReturnType[];
    starred?: boolean;
    watching?: boolean;
    className?: string;
}

export const ProjectListContainer: FC<{ children: ReactNode; offset?: number }> = ({ children, offset = 0 }) => (
    <Table columns={5} offset={offset}>
        {children}
    </Table>
);

export const ProjectListItem: React.FC<ProjectListItemProps> = ({
    href,
    children,
    title,
    owner,
    participants,
    starred,
    watching,
    className,
}) => {
    const row = (
        <TableRow className={className}>
            <TableCell>
                <Text size="l" weight="bold">
                    {title}
                </Text>
                {children}
            </TableCell>

            <TableCell>
                {nullable(owner, (o) => (
                    <UserGroup users={[o]} />
                ))}
            </TableCell>

            <TableCell>{nullable(participants, (p) => (p.length ? <UserGroup users={p} /> : null))}</TableCell>

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
    );

    return href ? (
        <Link href={href} passHref>
            {row}
        </Link>
    ) : (
        row
    );
};

export const ProjectItemStandalone: React.FC<ProjectListItemProps> = (props) => (
    <ProjectListContainer>
        <ProjectListItem {...props} />
    </ProjectListContainer>
);
