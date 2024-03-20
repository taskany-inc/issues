import { FC, useCallback } from 'react';
import { Button, Text, TableCell, TableRow } from '@taskany/bricks/harmony';
import { IconBinOutline } from '@taskany/icons';

import { TableRowItem } from '../Table/Table';

import s from './TeamListItem.module.css';

interface TeamListItemProps {
    name: string;
    units: number;
    onRemoveClick: () => void;
}

export const TeamListItem: FC<TeamListItemProps> = ({ name, units, onRemoveClick }) => {
    const onClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            e.preventDefault();
            onRemoveClick();
        },
        [onRemoveClick],
    );
    return (
        <TableRowItem title={<Text size="l">{name}</Text>}>
            <TableRow className={s.TeamListItemRow}>
                <TableCell className={s.TeamListItemColumn}>{units}</TableCell>
                <TableCell className={s.TeamListItemColumn} width={60}>
                    <Button onClick={onClick} size="xs" iconLeft={<IconBinOutline size="xs" />} />
                </TableCell>
            </TableRow>
        </TableRowItem>
    );
};
