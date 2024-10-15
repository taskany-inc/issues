import { nullable } from '@taskany/bricks';
import { CircleProgressBar, TableCell, TableRow, UserGroup } from '@taskany/bricks/harmony';
import cn from 'classnames';
import { ComponentProps, useMemo } from 'react';

import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { ProjectSubscriptionButtons } from '../ProjectSubscriptionButtons/ProjectSubscriptionButtons';
import { safeUserData } from '../../utils/getUserName';
import { participants as participantsDO } from '../../utils/domObjects';

import s from './ProjectListItem.module.css';

interface ProjectListItemProps {
    href?: string;
    id: string;
    stargizers: number;
    flowId: string;
    title: string;
    owner?: ActivityByIdReturnType;
    participants: ActivityByIdReturnType[] | null;
    starred?: boolean;
    watching?: boolean;
    averageScore: number | null;
    actionButtonView?: 'default' | 'icons';
}

export const ProjectListItem: React.FC<ProjectListItemProps & ComponentProps<typeof TableRow>> = ({
    id,
    flowId,
    title,
    owner,
    participants,
    stargizers,
    starred,
    watching,
    averageScore,
    className,
    actionButtonView,
    href,
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
                <TableCell width={90} {...participantsDO.attr}>
                    <UserGroup users={p} />
                </TableCell>
            ))}

            {nullable(averageScore, (score) => (
                <TableCell width={24}>
                    <CircleProgressBar value={score} />
                </TableCell>
            ))}
            <TableCell width={40} className={s.ProjectListItemIcons}>
                <ProjectSubscriptionButtons
                    project={{ flowId, id, title }}
                    starred={starred}
                    view={actionButtonView}
                    watching={watching}
                    stargizersCounter={stargizers}
                    href={href}
                />
            </TableCell>
        </TableRow>
    );
};
