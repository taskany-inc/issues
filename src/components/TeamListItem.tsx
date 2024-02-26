import { FC, useCallback } from 'react';
import { Button, Text } from '@taskany/bricks/harmony';
import { IconBinOutline } from '@taskany/icons';
import { TableCell, TableRow } from '@taskany/bricks';

import { TableRowItem } from './Table';

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
            <TableRow>
                <TableCell justify="end">{units}</TableCell>
                <TableCell justify="end" width={65}>
                    <Button onClick={onClick} size="xs" iconLeft={<IconBinOutline size="xs" />} />
                </TableCell>
            </TableRow>
        </TableRowItem>
    );
};
