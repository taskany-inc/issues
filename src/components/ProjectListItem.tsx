import { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { CircleProgressBar, Text, nullable, TableCell, TableRowProps, TableRow } from '@taskany/bricks';
import { textColor, gapS, radiusM } from '@taskany/colors';
import { IconStarSolid, IconEyeOutline } from '@taskany/icons';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

import { UserGroup } from './UserGroup';
import { collapseOffset } from './CollapsableItem';

const StyledTableRow = styled(TableRow)`
    text-decoration: none;
    color: ${textColor};
    padding: ${gapS};
    border-radius: ${radiusM};

    ${({ interactive }) =>
        interactive &&
        css`
            cursor: pointer;
        `}
`;

interface ProjectListItemProps {
    children?: ReactNode;
    title: string;
    owner?: ActivityByIdReturnType;
    participants?: ActivityByIdReturnType[];
    starred?: boolean;
    watching?: boolean;
    className?: string;
    disabled?: boolean;
    averageScore: number | null;
    onClick?: (e: React.MouseEvent) => void;
    deep?: number;
}

// px
const maxTitleColumnWidth = 420;

export const ProjectListItem: React.FC<ProjectListItemProps & TableRowProps> = ({
    children,
    title,
    owner,
    participants,
    starred,
    watching,
    averageScore,
    className,
    onClick,
    gap = 10,
    align = 'center',
    justify = 'start',
    deep,
    ...attrs
}) => {
    const titleColumnWidth = maxTitleColumnWidth - (deep ?? 0) * collapseOffset;

    return (
        <StyledTableRow
            className={className}
            gap={gap}
            align={align}
            justify={justify}
            onClick={onClick}
            interactive
            {...attrs}
        >
            <TableCell width={titleColumnWidth} align="center" justify="between">
                <Text size="l" weight="bold">
                    {title}
                </Text>
                {children}
            </TableCell>
            {nullable(owner, (o) => (
                <TableCell min>
                    <UserGroup users={[o]} />
                </TableCell>
            ))}
            {nullable(participants, (p) =>
                p.length ? (
                    <TableCell col={1}>
                        <UserGroup users={p} />
                    </TableCell>
                ) : null,
            )}
            {averageScore != null ? (
                <TableCell min>
                    <CircleProgressBar value={averageScore} size="m" />
                </TableCell>
            ) : null}

            {nullable(starred, () => (
                <TableCell min>
                    <IconStarSolid size="s" color={textColor} />
                </TableCell>
            ))}

            {nullable(watching, () => (
                <TableCell min>
                    <IconEyeOutline size="s" color={textColor} />
                </TableCell>
            ))}
        </StyledTableRow>
    );
};
