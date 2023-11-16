import { CircleProgressBar, nullable, TableCell, TableRowProps, TableRow } from '@taskany/bricks';
import { IconStarSolid, IconEyeOutline } from '@taskany/icons';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

import { UserGroup } from './UserGroup';

interface ProjectListItemProps {
    owner?: ActivityByIdReturnType;
    participants?: ActivityByIdReturnType[];
    starred?: boolean;
    watching?: boolean;
    className?: string;
    averageScore: number | null;
}

export const ProjectListItem: React.FC<ProjectListItemProps & Omit<TableRowProps, 'title'>> = ({
    owner,
    participants,
    starred,
    watching,
    averageScore,
    className,
    gap = 10,
    align = 'center',
    justify = 'start',
    ...attrs
}) => {
    return (
        <TableRow className={className} gap={gap} align={align} justify={justify} interactive {...attrs}>
            {nullable(owner, (o) => (
                <TableCell width={26}>
                    <UserGroup users={[o]} />
                </TableCell>
            ))}

            {nullable(participants, (p) => (
                <TableCell width={90}>
                    <UserGroup users={p} />
                </TableCell>
            ))}

            {nullable(averageScore, (score) => (
                <TableCell width={24}>
                    <CircleProgressBar value={score} />
                </TableCell>
            ))}

            <TableCell width={40} justify="between">
                {nullable(starred, () => (
                    <IconStarSolid size="s" />
                ))}
                {nullable(watching, () => (
                    <IconEyeOutline size="s" />
                ))}
            </TableCell>
        </TableRow>
    );
};
