import { Counter, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';
import { ComponentProps, useMemo } from 'react';

import { Priority } from '../../types/priority';
import { trpc } from '../../utils/trpcClient';
import { Dropdown, DropdownTrigger, DropdownPanel, DropdownGuardedProps } from '../Dropdown/Dropdown';
import { getPriorityText } from '../PriorityText/PriorityText';

type PriorityDropdownProps = {
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    view?: ComponentProps<typeof DropdownTrigger>['view'];
    value?: Priority | Priority[];
    className?: string;
    disabled?: boolean;
    readOnly?: boolean;
    onClose?: () => void;
} & DropdownGuardedProps<Priority>;

export const PriorityDropdown = ({ value, mode, onChange, onClose, ...props }: PriorityDropdownProps) => {
    const { data: priorities = [] } = trpc.priority.getAll.useQuery();

    const values = useMemo(() => {
        const res: Priority[] = [];
        return res.concat(value || []);
    }, [value]);

    return (
        <Dropdown arrow onClose={onClose}>
            <DropdownTrigger {...props}>
                {nullable(
                    mode === 'multiple' && values.length > 1,
                    () => (
                        <Counter count={values.length} />
                    ),
                    nullable(values, ([{ title }]) => (
                        <Text size="s" ellipsis>
                            {getPriorityText(title)}
                        </Text>
                    )),
                )}
            </DropdownTrigger>
            <DropdownPanel
                width={150}
                value={values}
                selectable
                mode={mode}
                items={priorities}
                onChange={onChange}
                renderItem={(props) => <Text size="s">{getPriorityText(props.item.title)}</Text>}
            />
        </Dropdown>
    );
};
