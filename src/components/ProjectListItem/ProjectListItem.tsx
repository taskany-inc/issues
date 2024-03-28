import { CircleProgressBar, nullable } from '@taskany/bricks';
import { TableCell, TableRow } from '@taskany/bricks/harmony';
import cn from 'classnames';
import { IconStarSolid, IconEyeOutline } from '@taskany/icons';
import { ComponentProps } from 'react';

import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { UserGroup } from '../UserGroup';
import { ProjectSubscriptionButtons } from '../ProjectSubscriptionButtons';

import s from './ProjectListItem.module.css';

interface ProjectListItemProps {
    id: string;
    stargizers: Pick<ActivityByIdReturnType, 'id'>[];
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
    return (
        <TableRow className={cn(s.ProjectListItemRow, className)} {...attrs}>
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
                            stargizersCounter={stargizers.length}
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
