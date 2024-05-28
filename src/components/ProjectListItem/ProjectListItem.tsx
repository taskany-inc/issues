import { nullable } from '@taskany/bricks';
import { CircleProgressBar, TableCell, TableRow, UserGroup } from '@taskany/bricks/harmony';
import cn from 'classnames';
import { IconStarSolid, IconEyeOutline } from '@taskany/icons';
import { ComponentProps, useMemo } from 'react';

import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { ProjectSubscriptionButtons } from '../ProjectSubscriptionButtons';
import { safeUserData } from '../../utils/getUserName';

import s from './ProjectListItem.module.css';

interface ProjectListItemProps {
    id: string;
    stargizers: number;
    editable?: boolean;
    owner?: ActivityByIdReturnType;
    participants?: ActivityByIdReturnType[];
    starred?: boolean;
    watching?: boolean;
    averageScore: number | null;
}

export const ProjectListItem: React.FC<ProjectListItemProps & ComponentProps<typeof TableRow>> = ({
    id,
    owner,
    participants,
    stargizers,
    starred,
    watching,
    averageScore,
    className,
    editable,
    ...attrs
}) => {
    const ownerUserGroup = useMemo(() => [owner].map(safeUserData).filter(Boolean), [owner]);
    const participantUserGroup = useMemo(() => participants?.map(safeUserData).filter(Boolean), [participants]);

    return (
        <TableRow className={cn(s.ProjectListItemRow, className)} {...attrs}>
            {nullable(ownerUserGroup, (o) => (
                <TableCell width={26}>
                    <UserGroup users={o} />
                </TableCell>
            ))}

            {nullable(participantUserGroup, (p) => (
                <TableCell width={90}>
                    <UserGroup users={p} />
                </TableCell>
            ))}

            {nullable(averageScore, (score) => (
                <TableCell width={24}>
                    <CircleProgressBar value={score} />
                </TableCell>
            ))}
            <TableCell
                width={40}
                className={cn(s.ProjectListItemIcons, {
                    [s.ProjectListItemIcons_editable]: editable,
                })}
            >
                {nullable(
                    editable,
                    () => (
                        <ProjectSubscriptionButtons
                            id={id}
                            starred={starred}
                            watching={watching}
                            stargizersCounter={stargizers}
                        />
                    ),
                    <>
                        {nullable(starred, () => (
                            <IconStarSolid size="s" />
                        ))}
                        {nullable(watching, () => (
                            <IconEyeOutline size="s" />
                        ))}
                    </>,
                )}
            </TableCell>
        </TableRow>
    );
};
