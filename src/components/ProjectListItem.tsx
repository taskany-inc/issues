import { FC, ReactNode, forwardRef } from 'react';
import { CircleProgressBar, EyeIcon, StarFilledIcon, Text, nullable } from '@taskany/bricks';
import styled from 'styled-components';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

import { Table, TableCell, TableRow } from './Table';
import { UserGroup } from './UserGroup';

interface ProjectListItemProps {
    as?: 'a' | 'div';
    href?: string;
    children?: ReactNode;
    title: string;
    owner?: ActivityByIdReturnType;
    participants?: ActivityByIdReturnType[];
    starred?: boolean;
    watching?: boolean;
    className?: string;
    disabled?: boolean;
    averageScore: number | null;
}

const StyledTitleCell = styled(TableCell)`
    justify-content: space-between;
`;

export const ProjectListContainer: FC<{ children: ReactNode; offset?: number }> = ({ children, offset = 0 }) => (
    <Table columns={6} offset={offset}>
        {children}
    </Table>
);

export const ProjectListItem = forwardRef<HTMLDivElement, ProjectListItemProps>(
    (
        { as = 'div', children, title, owner, participants, starred, watching, averageScore, className, ...props },
        ref,
    ) => (
        <TableRow as={as} className={className} ref={ref} {...props}>
            <StyledTitleCell>
                <Text size="l" weight="bold">
                    {title}
                </Text>
                {children}
            </StyledTitleCell>

            <TableCell>
                {nullable(owner, (o) => (
                    <UserGroup users={[o]} />
                ))}
            </TableCell>

            <TableCell>{nullable(participants, (p) => (p.length ? <UserGroup users={p} /> : null))}</TableCell>
            <TableCell>{averageScore != null ? <CircleProgressBar value={averageScore} size="m" /> : null}</TableCell>

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
    ),
);
