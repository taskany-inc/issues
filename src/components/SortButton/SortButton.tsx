import { ComponentProps, FC } from 'react';
import { Button } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';
import { IconArrowDownOutline, IconArrowUpOutline } from '@taskany/icons';

import { SortDirection } from '../../utils/parseUrlParams';

const getNextDirection = (currentDirection?: SortDirection | null): SortDirection | null => {
    switch (currentDirection) {
        case 'asc':
            return 'desc';
        case 'desc':
            return null;
        default:
            return 'asc';
    }
};

interface SortButtonProps extends Omit<ComponentProps<typeof Button>, 'value' | 'onChange'> {
    title: string;
    value?: SortDirection | null;
    onChange?: (value: SortDirection | null) => void;
}

export const SortButton: FC<SortButtonProps> = ({ title, value, onChange }) => {
    return (
        <Button
            text={title}
            view={value ? 'checked' : 'default'}
            iconRight={nullable(value, (v) =>
                v === 'asc' ? <IconArrowDownOutline size="s" /> : <IconArrowUpOutline size="s" />,
            )}
            onClick={() => onChange?.(getNextDirection(value))}
        />
    );
};
