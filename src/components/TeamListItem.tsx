import { FC, useCallback } from 'react';
import { Button, Text } from '@taskany/bricks/harmony';
import { IconBinOutline } from '@taskany/icons';
import { TableCell } from '@taskany/bricks';

import { TableRowItem } from './Table';

interface TeamListItemProps {
    name: string;
    onRemoveClick: () => void;
}

export const TeamListItem: FC<TeamListItemProps> = ({ name, onRemoveClick }) => {
    const onClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            e.preventDefault();
            onRemoveClick();
        },
        [onRemoveClick],
    );
    return (
        <TableRowItem title={<Text size="l">{name}</Text>}>
            <TableCell justify="end">
                <Button onClick={onClick} size="xs" iconLeft={<IconBinOutline size="xs" />} />
            </TableCell>
        </TableRowItem>
    );
};
